"""
PyMuPDF-based PDF text extractor.
Primary extraction method — fast, no API calls, works offline.
Falls back to iApp OCR when extracted text is below threshold (scanned docs).
"""

from __future__ import annotations

import logging
from typing import Optional

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


class PyMuPDFExtractor:
    """Extract text from PDF files using PyMuPDF (fitz)."""

    def extract_text(self, pdf_bytes: bytes) -> dict:
        """
        Extract text from a PDF byte stream.

        Returns:
            {
                "text": str,           # Full concatenated text
                "pages": [...],        # Per-page text
                "page_count": int,
                "char_count": int,
                "method": "pymupdf",
            }
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages: list[dict] = []
            full_text_parts: list[str] = []

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text("text")
                pages.append({
                    "page_number": page_num + 1,
                    "text": text.strip(),
                    "char_count": len(text.strip()),
                })
                full_text_parts.append(text.strip())

            doc.close()

            full_text = "\n\n".join(full_text_parts)
            return {
                "text": full_text,
                "pages": pages,
                "page_count": len(pages),
                "char_count": len(full_text),
                "method": "pymupdf",
            }

        except Exception as e:
            logger.error("PyMuPDF extraction failed: %s", str(e))
            return {
                "text": "",
                "pages": [],
                "page_count": 0,
                "char_count": 0,
                "method": "pymupdf",
                "error": str(e),
            }

    def extract_with_layout(self, pdf_bytes: bytes) -> list[dict]:
        """
        Extract text blocks with bounding-box positions.
        Useful for understanding document structure (headings, paragraphs, tables).
        Returns line-level components so highlight anchors are more precise.
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages_layout: list[dict] = []

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                blocks = page.get_text("dict")["blocks"]
                components: list[dict] = []
                page_width = float(page.rect.width)
                page_height = float(page.rect.height)

                for block in blocks:
                    if block.get("type") != 0:
                        continue

                    for line in block.get("lines", []):
                        spans = line.get("spans", [])
                        text = "".join(span.get("text", "") for span in spans).strip()
                        if not text:
                            continue

                        bbox = line.get("bbox") or _merge_span_bboxes(spans)
                        if not bbox:
                            continue

                        avg_size = _average_span_size(spans)
                        components.append({
                            "text": text,
                            "bbox": bbox,
                            "type": _classify_text_size(avg_size),
                        })

                pages_layout.append({
                    "page_number": page_num + 1,
                    "page_width": page_width,
                    "page_height": page_height,
                    "components": components,
                })

            doc.close()
            return pages_layout

        except Exception as e:
            logger.error("PyMuPDF layout extraction failed: %s", str(e))
            return []


def _average_span_size(spans: list[dict]) -> float:
    sizes = [float(span.get("size", 12)) for span in spans if span.get("size")]
    return sum(sizes) / len(sizes) if sizes else 12.0


def _merge_span_bboxes(spans: list[dict]) -> list[float]:
    boxes = [span.get("bbox") for span in spans if len(span.get("bbox") or []) == 4]
    if not boxes:
        return []

    x0 = min(float(box[0]) for box in boxes)
    y0 = min(float(box[1]) for box in boxes)
    x1 = max(float(box[2]) for box in boxes)
    y1 = max(float(box[3]) for box in boxes)
    return [x0, y0, x1, y1]


def _classify_text_size(avg_size: float) -> str:
    if avg_size >= 16:
        return "heading"
    if avg_size >= 13:
        return "subheading"
    return "paragraph"


def _classify_block(block: dict) -> str:
    """
    Heuristic classification of a text block.
    Based on font size and position.
    """
    if not block.get("lines"):
        return "unknown"

    sizes: list[float] = []
    for line in block["lines"]:
        for span in line.get("spans", []):
            sizes.append(span.get("size", 12))

    avg_size = sum(sizes) / len(sizes) if sizes else 12

    return _classify_text_size(avg_size)
