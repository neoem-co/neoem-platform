"""
iApp Thai Document OCR — fallback when PyMuPDF yields too little text
(e.g. scanned / image-based PDFs).

API reference:
  POST https://api.iapp.co.th/v3/store/ocr/document/ocr   → plain text
  POST https://api.iapp.co.th/v3/store/ocr/document/layout → JSON with bounding boxes
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings

logger = logging.getLogger(__name__)


class IAppOCR:
    """Client for iApp General Thai Document OCR API."""

    def __init__(self) -> None:
        self._api_key = settings.iapp_api_key
        self._ocr_url = settings.iapp_ocr_url
        self._layout_url = settings.iapp_ocr_layout_url

    # ── Plain-text OCR ───────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def extract_text(self, file_bytes: bytes, filename: str = "document.pdf") -> dict:
        """
        Send a file to iApp OCR and get plain text back.

        Returns:
            {
                "text": str,
                "pages": [...],        # iApp returns text per-page as a list
                "page_count": int,
                "char_count": int,
                "method": "iapp_ocr",
                "processing_time": float,
            }
        """
        mime = "application/pdf" if filename.lower().endswith(".pdf") else "image/jpeg"

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self._ocr_url,
                headers={"apikey": self._api_key},
                files={"file": (filename, file_bytes, mime)},
            )
            response.raise_for_status()
            data = response.json()

        # iApp response format: { "text": ["page1...", "page2..."], "time": 1.14, "iapp": { "page": N, "char": M } }
        text_list: list[str] = data.get("text", [])
        full_text = "\n\n".join(text_list)
        iapp_meta = data.get("iapp", {})

        pages = [
            {
                "page_number": i + 1,
                "text": t.strip(),
                "char_count": len(t.strip()),
            }
            for i, t in enumerate(text_list)
        ]

        return {
            "text": full_text,
            "pages": pages,
            "page_count": iapp_meta.get("page", len(text_list)),
            "char_count": iapp_meta.get("char", len(full_text)),
            "method": "iapp_ocr",
            "processing_time": data.get("time", 0),
        }

    # ── Layout-aware OCR (with bounding boxes) ──────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def extract_layout(self, file_bytes: bytes, filename: str = "document.pdf") -> dict:
        """
        Send a file to iApp OCR Layout endpoint.
        Returns structured JSON with bounding boxes and component types.
        """
        mime = "application/pdf" if filename.lower().endswith(".pdf") else "image/jpeg"

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self._layout_url,
                headers={"apikey": self._api_key},
                files={"file": (filename, file_bytes, mime)},
            )
            response.raise_for_status()
            data = response.json()

        return {
            "pages": data.get("pages", []),
            "processing_time": data.get("time", 0),
            "char_count": data.get("iapp", {}).get("char", 0),
            "method": "iapp_ocr_layout",
        }


class OCRService:
    """
    Unified OCR service.
    Strategy: PyMuPDF first → if char count < threshold → iApp OCR fallback.
    """

    def __init__(self) -> None:
        from services.ocr.pymupdf_extractor import PyMuPDFExtractor

        self._pymupdf = PyMuPDFExtractor()
        self._iapp = IAppOCR()
        self._threshold = settings.ocr_char_threshold

    async def extract(self, file_bytes: bytes, filename: str = "document.pdf") -> dict:
        """
        Extract text using the best available method.

        1. Try PyMuPDF (fast, offline)
        2. If result has < threshold chars → call iApp OCR
        """
        logger.info("Starting OCR extraction for: %s", filename)

        # Step 1: PyMuPDF
        result = self._pymupdf.extract_text(file_bytes)

        if result.get("char_count", 0) >= self._threshold:
            logger.info(
                "PyMuPDF succeeded: %d chars extracted", result["char_count"]
            )
            return result

        # Step 2: Fallback to iApp OCR
        logger.info(
            "PyMuPDF yielded only %d chars (threshold=%d), falling back to iApp OCR",
            result.get("char_count", 0),
            self._threshold,
        )

        try:
            iapp_result = await self._iapp.extract_text(file_bytes, filename)
            logger.info(
                "iApp OCR succeeded: %d chars extracted", iapp_result.get("char_count", 0)
            )
            return iapp_result
        except Exception as e:
            logger.error("iApp OCR also failed: %s — returning PyMuPDF result", str(e))
            result["fallback_error"] = str(e)
            return result
