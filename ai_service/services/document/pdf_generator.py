"""
PDF generator for finalised contracts.
Uses fpdf2 with HarfBuzz text shaping for proper Thai rendering.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from fpdf import FPDF

from models.contract_draft import ContractArticle, PartyInfo

logger = logging.getLogger(__name__)

# ── Font paths ───────────────────────────────────────────────────────────────
_FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "fonts")
_FONT_REGULAR = os.path.join(_FONT_DIR, "Sarabun-Regular.ttf")
_FONT_BOLD = os.path.join(_FONT_DIR, "Sarabun-Bold.ttf")

# A4 dimensions in mm
_A4_W = 210
_A4_H = 297
_MARGIN_LEFT = 25
_MARGIN_RIGHT = 25
_MARGIN_TOP = 20
_MARGIN_BOTTOM = 20
_CONTENT_W = _A4_W - _MARGIN_LEFT - _MARGIN_RIGHT

# Thai typesetting constants
_LINE_HEIGHT = 7          # mm per line (comfortable 1.0 spacing for 14pt)
_PARA_INDENT = 12.5       # mm first-line indent (≈1 tab, standard Thai ย่อหน้า)
_SECTION_GAP = 4          # mm gap between articles
_HEADING_GAP_BEFORE = 6   # mm gap before article heading
_HEADING_GAP_AFTER = 1    # mm gap after article heading


class _ContractPDF(FPDF):
    """Thin subclass to add page-number footer."""

    def footer(self):
        self.set_y(-15)
        self.set_font("Sarabun", "", 9)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, f"- {self.page_no()} -", align="C")


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
    pdf = _ContractPDF()
    pdf.set_text_shaping(True)

    # Register Sarabun font
    pdf.add_font("Sarabun", "", _FONT_REGULAR)
    pdf.add_font("Sarabun", "B", _FONT_BOLD)

    pdf.set_margins(_MARGIN_LEFT, _MARGIN_TOP, _MARGIN_RIGHT)
    pdf.set_auto_page_break(True, margin=_MARGIN_BOTTOM)
    pdf.add_page()

    # ── Title ────────────────────────────────────────────────────────────
    pdf.set_font("Sarabun", "B", 18)
    pdf.multi_cell(
        w=_CONTENT_W, h=9, text=title,
        align="C", new_x="LMARGIN", new_y="NEXT",
    )
    pdf.ln(3)

    if effective_date:
        pdf.set_font("Sarabun", "", 12)
        pdf.cell(
            w=_CONTENT_W, h=_LINE_HEIGHT,
            text=f"ลงวันที่ {effective_date}",
            align="C", new_x="LMARGIN", new_y="NEXT",
        )
        pdf.ln(6)

    # ── Preamble ─────────────────────────────────────────────────────────
    if preamble:
        pdf.set_font("Sarabun", "", 14)
        for para_text in preamble.split("\n"):
            para_text = para_text.strip()
            if para_text:
                _write_indented_para(pdf, para_text)
        pdf.ln(_SECTION_GAP)

    # ── Articles ─────────────────────────────────────────────────────────
    for article in articles:
        # Space before article
        pdf.ln(_HEADING_GAP_BEFORE)

        # Article heading — centered, bold
        pdf.set_font("Sarabun", "B", 14)
        heading = f"ข้อ {article.article_number}  {article.title_th}"
        pdf.multi_cell(
            w=_CONTENT_W, h=_LINE_HEIGHT, text=heading,
            align="C", new_x="LMARGIN", new_y="NEXT",
        )
        pdf.ln(_HEADING_GAP_AFTER)

        # Article body — justified with proper Thai indentation
        pdf.set_font("Sarabun", "", 14)
        body = article.body_th.strip()
        for para in body.split("\n"):
            para = para.strip()
            if not para:
                pdf.ln(_LINE_HEIGHT * 0.5)  # half-line gap for empty lines
                continue
            _write_indented_para(pdf, para)
        pdf.ln(_SECTION_GAP)

    # ── Signature block ──────────────────────────────────────────────────
    pdf.ln(15)
    pdf.set_font("Sarabun", "", 14)

    col_w = _CONTENT_W / 2

    if len(parties) >= 2:
        _draw_sig_pair(pdf, col_w, parties[0], parties[1])
    elif len(parties) == 1:
        _draw_sig_single(pdf, parties[0])

    # Witness block
    pdf.ln(15)
    y_start = pdf.get_y()
    # Left witness
    pdf.set_xy(_MARGIN_LEFT, y_start)
    pdf.cell(w=col_w, text="ลงชื่อ .........................................พยาน", align="C")
    # Right witness
    pdf.set_xy(_MARGIN_LEFT + col_w, y_start)
    pdf.cell(w=col_w, text="ลงชื่อ .........................................พยาน", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    y2 = pdf.get_y()
    pdf.set_xy(_MARGIN_LEFT, y2)
    pdf.cell(w=col_w, text="( ............................................. )", align="C")
    pdf.set_xy(_MARGIN_LEFT + col_w, y2)
    pdf.cell(w=col_w, text="( ............................................. )", align="C", new_x="LMARGIN", new_y="NEXT")

    # ── Footer line ──────────────────────────────────────────────────────
    pdf.ln(15)
    pdf.set_font("Sarabun", "", 9)
    pdf.set_text_color(160, 160, 160)
    pdf.cell(w=_CONTENT_W, text="Generated by NeoEM AI Contract Drafting Service", align="C")
    pdf.set_text_color(0, 0, 0)

    return pdf.output()


# ── Helpers ──────────────────────────────────────────────────────────────────


import re as _re

_NUMBERED_PREFIX = _re.compile(
    r"^(?:\d+[\.\)]|"       # 1. 1) 1.1 etc.
    r"\([ก-ฮa-zA-Z]\)|"    # (ก) (a)
    r"[ก-ฮ][\.)])"         # ก. ก)
)


def _write_indented_para(pdf: FPDF, text: str):
    """Write a paragraph.
    Plain paragraphs get Thai-style ย่อหน้า first-line indent.
    Numbered/lettered sub-items (1.1, (ก), etc.) are written flush-left.
    """
    if _NUMBERED_PREFIX.match(text):
        # Sub-item — no indent, full content width
        pdf.multi_cell(
            w=_CONTENT_W, h=_LINE_HEIGHT, text=text,
            align="J", new_x="LMARGIN", new_y="NEXT",
        )
    else:
        # New paragraph — apply ย่อหน้า first-line indent
        x0 = pdf.get_x()
        pdf.set_x(x0 + _PARA_INDENT)
        first_line_w = _CONTENT_W - _PARA_INDENT
        pdf.multi_cell(
            w=first_line_w, h=_LINE_HEIGHT, text=text,
            align="J", new_x="LMARGIN", new_y="NEXT",
        )


def _draw_sig_pair(pdf: FPDF, col_w: float, left: PartyInfo, right: PartyInfo):
    """Draw a two-column signature block."""
    rows = [
        ("ลงชื่อ .........................................", "ลงชื่อ ........................................."),
        (f"( {left.name} )", f"( {right.name} )"),
        (left.role, right.role),
    ]
    for left_text, right_text in rows:
        y = pdf.get_y()
        pdf.set_xy(_MARGIN_LEFT, y)
        pdf.cell(w=col_w, h=_LINE_HEIGHT, text=left_text, align="C")
        pdf.set_xy(_MARGIN_LEFT + col_w, y)
        pdf.cell(w=col_w, h=_LINE_HEIGHT, text=right_text, align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)


def _draw_sig_single(pdf: FPDF, party: PartyInfo):
    """Draw a single centered signature block."""
    for text in [
        "ลงชื่อ .........................................",
        f"( {party.name} )",
        party.role,
    ]:
        pdf.cell(w=_CONTENT_W, text=text, align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
