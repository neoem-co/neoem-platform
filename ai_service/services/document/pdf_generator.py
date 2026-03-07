"""
PDF generator for finalised contracts.
Uses ReportLab with Thai font support.
"""

from __future__ import annotations

import io
import logging
import os
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from models.contract_draft import ContractArticle, PartyInfo

logger = logging.getLogger(__name__)

# ── Font registration ────────────────────────────────────────────────────────
# We attempt to register a Thai-capable font.
# If not available, fall back to Helvetica (will not render Thai correctly in prod).
_THAI_FONT_NAME = "THSarabun"
_FONT_REGISTERED = False


def _ensure_font() -> str:
    """Register a Thai TrueType font if available. Return the font name to use."""
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return _THAI_FONT_NAME

    # Common locations for TH Sarabun New
    font_paths = [
        "./fonts/THSarabunNew.ttf",
        "./fonts/THSarabunNew Bold.ttf",
        "C:/Windows/Fonts/THSarabunNew.ttf",
        "/usr/share/fonts/truetype/th-sarabun-new/THSarabunNew.ttf",
    ]

    for path in font_paths:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(_THAI_FONT_NAME, path))
                _FONT_REGISTERED = True
                logger.info("Registered Thai font: %s", path)
                return _THAI_FONT_NAME
            except Exception as e:
                logger.warning("Failed to register font %s: %s", path, e)

    logger.warning("Thai font not found — PDF will use Helvetica (Thai text may not render)")
    return "Helvetica"


# ── Styles ───────────────────────────────────────────────────────────────────


def _get_styles(font_name: str) -> dict:
    """Build paragraph styles for the contract."""
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ContractTitle",
            parent=base["Title"],
            fontName=font_name,
            fontSize=18,
            leading=24,
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "subtitle": ParagraphStyle(
            "ContractSubtitle",
            parent=base["Normal"],
            fontName=font_name,
            fontSize=12,
            leading=16,
            alignment=TA_CENTER,
            spaceAfter=20,
        ),
        "preamble": ParagraphStyle(
            "ContractPreamble",
            parent=base["Normal"],
            fontName=font_name,
            fontSize=11,
            leading=16,
            alignment=TA_JUSTIFY,
            spaceAfter=12,
        ),
        "article_title": ParagraphStyle(
            "ArticleTitle",
            parent=base["Heading2"],
            fontName=font_name,
            fontSize=13,
            leading=18,
            spaceBefore=12,
            spaceAfter=6,
        ),
        "article_body": ParagraphStyle(
            "ArticleBody",
            parent=base["Normal"],
            fontName=font_name,
            fontSize=11,
            leading=16,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
            leftIndent=1 * cm,
        ),
        "footer": ParagraphStyle(
            "ContractFooter",
            parent=base["Normal"],
            fontName=font_name,
            fontSize=9,
            leading=12,
            textColor=colors.grey,
            alignment=TA_CENTER,
        ),
    }


# ── Generator ────────────────────────────────────────────────────────────────


def generate_contract_pdf(
    title: str,
    preamble: str,
    articles: list[ContractArticle],
    parties: list[PartyInfo],
    effective_date: Optional[str] = None,
) -> bytes:
    """
    Generate a PDF contract document.
    Returns the PDF as bytes.
    """
    font_name = _ensure_font()
    styles = _get_styles(font_name)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
    )

    story: list = []

    # ── Header ───────────────────────────────────────────────────────────
    story.append(Paragraph("MANUFACTURING AGREEMENT", styles["title"]))
    story.append(Paragraph(title, styles["subtitle"]))

    if effective_date:
        story.append(Paragraph(f"ลงวันที่ {effective_date}", styles["subtitle"]))

    story.append(Spacer(1, 10))

    # ── Preamble ─────────────────────────────────────────────────────────
    if preamble:
        story.append(Paragraph(preamble, styles["preamble"]))
        story.append(Spacer(1, 10))

    # ── Articles ─────────────────────────────────────────────────────────
    for article in articles:
        article_header = f"ข้อ {article.article_number}: {article.title_th}"
        story.append(Paragraph(article_header, styles["article_title"]))

        # Replace newlines with <br/> for ReportLab
        body_html = article.body_th.replace("\n", "<br/>")
        story.append(Paragraph(body_html, styles["article_body"]))

    # ── Signature block ──────────────────────────────────────────────────
    story.append(Spacer(1, 40))

    if parties:
        sig_data = []
        for party in parties:
            sig_data.append([
                f"ลงชื่อ .....................................",
                "",
                f"ลงชื่อ .....................................",
            ])
            names = [p.name for p in parties]
            if len(names) >= 2:
                sig_data.append([
                    f"( {names[0]} )",
                    "",
                    f"( {names[1]} )",
                ])
                sig_data.append([
                    parties[0].role if len(parties) > 0 else "",
                    "",
                    parties[1].role if len(parties) > 1 else "",
                ])
                break  # Only two signature columns

        if sig_data:
            table = Table(sig_data, colWidths=[6 * cm, 2 * cm, 6 * cm])
            table.setStyle(
                TableStyle([
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                ])
            )
            story.append(table)

    # ── Footer ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 30))
    story.append(
        Paragraph(
            "Generated by NeoEM AI Contract Drafting Service",
            styles["footer"],
        )
    )

    # Build PDF
    doc.build(story)
    return buffer.getvalue()
