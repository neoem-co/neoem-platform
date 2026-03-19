"""
DOCX -> PDF converter utilities.

Primary intent: keep PDF output visually aligned with DOCX layout (Thai-friendly).
Conversion strategy:
1) LibreOffice headless (soffice)
2) docx2pdf (if installed)

Raise RuntimeError if all conversion methods fail.
"""

from __future__ import annotations

import hashlib
import logging
import os
import platform
import shutil
import subprocess
import tempfile
import threading
from collections import OrderedDict
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

_CACHE_LOCK = threading.Lock()
_PDF_CACHE: "OrderedDict[str, bytes]" = OrderedDict()
_PDF_CACHE_MAX_ENTRIES = int(os.getenv("NEOEM_DOCX_PDF_CACHE_ENTRIES", "8"))


def convert_docx_bytes_to_pdf_bytes(docx_bytes: bytes, base_name: str = "contract") -> bytes:
    """Convert DOCX bytes to PDF bytes using available local tools."""
    docx_hash = hashlib.sha256(docx_bytes).hexdigest()
    cached = _cache_get(docx_hash)
    if cached is not None:
        logger.info("DOCX->PDF cache hit")
        return cached

    with tempfile.TemporaryDirectory(prefix="neoem_docx_pdf_") as tmp_dir:
        tmp_path = Path(tmp_dir)
        docx_path = tmp_path / f"{base_name}.docx"
        pdf_path = tmp_path / f"{base_name}.pdf"
        docx_path.write_bytes(docx_bytes)

        errors: list[str] = []
        methods = get_available_conversion_methods()
        if not methods:
            raise RuntimeError("No DOCX->PDF converter available (missing LibreOffice/docx2pdf)")

        for method in methods:
            try:
                if method == "soffice":
                    _convert_with_soffice(docx_path, tmp_path)
                elif method == "docx2pdf":
                    _convert_with_docx2pdf(docx_path, pdf_path)
                else:
                    continue

                if pdf_path.exists() and pdf_path.stat().st_size > 0:
                    logger.info("DOCX->PDF conversion succeeded via %s", method)
                    pdf_bytes = pdf_path.read_bytes()
                    _cache_set(docx_hash, pdf_bytes)
                    return pdf_bytes
                errors.append(f"{method}: output PDF not found")
            except Exception as exc:
                errors.append(f"{method}: {exc}")

        raise RuntimeError("; ".join(errors) or "DOCX->PDF conversion failed")


@lru_cache(maxsize=1)
def get_available_conversion_methods() -> tuple[str, ...]:
    """Detect and cache available conversion methods (fast path for repeated requests)."""
    supported = {
        "soffice": bool(_find_soffice_binary()),
        "docx2pdf": _has_docx2pdf(),
    }
    methods = [m for m in _get_preferred_method_order() if supported.get(m)]
    logger.info("Available DOCX->PDF methods: %s", methods or ["none"])
    return tuple(methods)


def _convert_with_soffice(docx_path: Path, out_dir: Path) -> None:
    """Use headless LibreOffice conversion."""
    soffice_bin = _find_soffice_binary()
    if not soffice_bin:
        raise RuntimeError("soffice not found")

    cmd = [
        soffice_bin,
        "--headless",
        "--nologo",
        "--nodefault",
        "--nolockcheck",
        "--nofirststartwizard",
        "--convert-to",
        "pdf:writer_pdf_Export",
        "--outdir",
        str(out_dir),
        str(docx_path),
    ]
    proc = subprocess.run(
        cmd,
        check=False,
        capture_output=True,
        text=True,
        timeout=int(os.getenv("NEOEM_DOCX_PDF_TIMEOUT", "60")),
    )
    if proc.returncode != 0:
        stderr = (proc.stderr or "").strip()
        stdout = (proc.stdout or "").strip()
        detail = stderr or stdout or f"exit code {proc.returncode}"
        raise RuntimeError(detail)


def _convert_with_docx2pdf(docx_path: Path, pdf_path: Path) -> None:
    """Use docx2pdf when available (Word automation on Windows)."""
    try:
        from docx2pdf import convert
    except Exception as exc:
        raise RuntimeError("docx2pdf not installed") from exc

    keep_active = _keep_docx2pdf_word_active()
    try:
        convert(str(docx_path), str(pdf_path), keep_active=keep_active)
    except TypeError:
        # Backward compatibility with older docx2pdf signatures.
        convert(str(docx_path), str(pdf_path))


def _find_soffice_binary() -> str | None:
    """Find LibreOffice binary in PATH or common Windows install paths."""
    in_path = shutil.which("soffice") or shutil.which("soffice.exe")
    if in_path:
        return in_path

    candidate_paths = [
        os.path.join("C:\\", "Program Files", "LibreOffice", "program", "soffice.exe"),
        os.path.join("C:\\", "Program Files (x86)", "LibreOffice", "program", "soffice.exe"),
    ]
    for candidate in candidate_paths:
        if os.path.exists(candidate):
            return candidate
    return None


def _has_docx2pdf() -> bool:
    """Check whether docx2pdf import is available."""
    try:
        import docx2pdf  # noqa: F401
        return True
    except Exception:
        return False


def _get_preferred_method_order() -> tuple[str, ...]:
    """
    Decide converter order.
    - On Windows, docx2pdf can be faster after Word warm-up.
    - Else prefer LibreOffice first.
    - Can override with NEOEM_DOCX_PDF_PREFERRED=docx2pdf|soffice|auto
    """
    preferred = os.getenv("NEOEM_DOCX_PDF_PREFERRED", "auto").strip().lower()
    if preferred == "docx2pdf":
        return ("docx2pdf", "soffice")
    if preferred == "soffice":
        return ("soffice", "docx2pdf")
    if platform.system().lower().startswith("win"):
        return ("docx2pdf", "soffice")
    return ("soffice", "docx2pdf")


def _keep_docx2pdf_word_active() -> bool:
    """
    Keep Word process alive between conversions for better throughput on Windows.
    Override with NEOEM_DOCX2PDF_KEEP_ACTIVE=true|false
    """
    configured = os.getenv("NEOEM_DOCX2PDF_KEEP_ACTIVE", "auto").strip().lower()
    if configured in ("1", "true", "yes"):
        return True
    if configured in ("0", "false", "no"):
        return False
    return platform.system().lower().startswith("win")


def _cache_get(docx_hash: str) -> bytes | None:
    if _PDF_CACHE_MAX_ENTRIES <= 0:
        return None
    with _CACHE_LOCK:
        data = _PDF_CACHE.get(docx_hash)
        if data is None:
            return None
        _PDF_CACHE.move_to_end(docx_hash)
        return data


def _cache_set(docx_hash: str, pdf_bytes: bytes) -> None:
    if _PDF_CACHE_MAX_ENTRIES <= 0:
        return
    with _CACHE_LOCK:
        _PDF_CACHE[docx_hash] = pdf_bytes
        _PDF_CACHE.move_to_end(docx_hash)
        while len(_PDF_CACHE) > _PDF_CACHE_MAX_ENTRIES:
            _PDF_CACHE.popitem(last=False)
