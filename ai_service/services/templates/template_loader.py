"""
Template Loader Service — loads contract templates from JSON files
and prepares them for the LLM generation pipeline.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_TEMPLATE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "templates"
_LEGAL_REFS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "legal_refs"

_TEMPLATE_CACHE: dict[str, dict] = {}
_LEGAL_REFS_CACHE: dict[str, str] = {}


def load_template(template_type: str) -> Optional[dict]:
    """Load a contract template JSON by template_type (e.g. 'hire_of_work')."""
    if template_type in _TEMPLATE_CACHE:
        return _TEMPLATE_CACHE[template_type]

    path = _TEMPLATE_DIR / f"{template_type}.json"
    if not path.exists():
        logger.warning("Template file not found: %s", path)
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            tpl = json.load(f)
        _TEMPLATE_CACHE[template_type] = tpl
        logger.info("Loaded template: %s (%d articles)", template_type, len(tpl.get("articles", [])))
        return tpl
    except Exception as e:
        logger.error("Failed to load template %s: %s", template_type, e)
        return None


def fill_preamble(template: dict, parties: list[dict], date: Optional[str] = None) -> str:
    """Fill preamble_template placeholders with party data."""
    preamble = template.get("preamble_template", "")
    if not preamble:
        return ""

    buyer = next((p for p in parties if p.get("role") == "buyer"), {})
    seller = next((p for p in parties if p.get("role") in ("seller", "vendor")), {})

    _dots = ".............................."
    replacements = {
        "{location}": "กรุงเทพมหานคร",
        "{date}": date or _dots,
        "{buyer_name}": buyer.get("name") or _dots,
        "{buyer_company}": buyer.get("company") or _dots,
        "{seller_name}": seller.get("name") or _dots,
        "{seller_company}": seller.get("company") or _dots,
    }

    for placeholder, value in replacements.items():
        preamble = preamble.replace(placeholder, str(value))

    return preamble


def build_article_skeleton(template: dict) -> str:
    """Build a compact article skeleton string for the LLM prompt."""
    articles = template.get("articles", [])
    lines = []
    for a in articles:
        num = a["article_number"]
        title_th = a["title_th"]
        title_en = a["title_en"]
        guidance = a.get("guidance", "")
        required = "REQUIRED" if a.get("required") else "optional"
        lines.append(f"ข้อ {num}. {title_th} / {title_en} [{required}]")
        if guidance:
            lines.append(f"   คำแนะนำ: {guidance}")
    return "\n".join(lines)


def build_fairness_checklist(template: dict) -> str:
    """Build the fairness checklist string from template."""
    checks = template.get("fairness_checks", [])
    if not checks:
        return ""
    return "\n".join(f"- {c}" for c in checks)


def load_legal_refs(template_type: str) -> str:
    """Load legal reference markdown for a given template type."""
    if template_type in _LEGAL_REFS_CACHE:
        return _LEGAL_REFS_CACHE[template_type]

    path = _LEGAL_REFS_DIR / f"{template_type}_refs.md"
    if not path.exists():
        logger.warning("Legal refs not found: %s", path)
        return ""

    try:
        content = path.read_text(encoding="utf-8")
        _LEGAL_REFS_CACHE[template_type] = content
        logger.info("Loaded legal refs: %s (%d chars)", template_type, len(content))
        return content
    except Exception as e:
        logger.error("Failed to load legal refs %s: %s", template_type, e)
        return ""
