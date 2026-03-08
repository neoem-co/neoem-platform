"""
DOCX generator for finalised contracts.
Uses python-docx.
"""

from __future__ import annotations

import io
import logging
from typing import Optional

from docx import Document as DocxDocument
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from models.contract_draft import ContractArticle, PartyInfo

logger = logging.getLogger(__name__)

# Thai font to use in DOCX — the system must have it installed.
_THAI_DOCX_FONT = "Angsana New"


def _set_run_font(run, size: int, font_name: str = _THAI_DOCX_FONT):
    """Set font name and size on a python-docx Run."""
    run.font.name = font_name
    run.font.size = Pt(size)


def generate_contract_docx(
    title: str,
    preamble: str,
    articles: list[ContractArticle],
    parties: list[PartyInfo],
    effective_date: Optional[str] = None,
) -> bytes:
    """
    Generate a Word (.docx) contract document.
    Returns the DOCX file as bytes.
    """
    doc = DocxDocument()

    # ── Page margins ─────────────────────────────────────────────────────
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    # ── Title ────────────────────────────────────────────────────────────
    heading = doc.add_heading(title, level=0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in heading.runs:
        _set_run_font(run, 18)

    if effective_date:
        date_para = doc.add_paragraph(f"ลงวันที่ {effective_date}")
        date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in date_para.runs:
            _set_run_font(run, 11)
            run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    doc.add_paragraph()  # spacer

    # ── Preamble ─────────────────────────────────────────────────────────
    if preamble:
        for para_text in preamble.split("\n"):
            para_text = para_text.strip()
            if para_text:
                preamble_para = doc.add_paragraph(para_text)
                preamble_para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                preamble_para.paragraph_format.first_line_indent = Cm(1.5)
                for run in preamble_para.runs:
                    _set_run_font(run, 14)
        doc.add_paragraph()

    # ── Articles ─────────────────────────────────────────────────────────
    for article in articles:
        # Article heading — centered like Thai legal format
        heading = doc.add_heading(
            f"ข้อ {article.article_number}  {article.title_th}",
            level=2,
        )
        heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in heading.runs:
            _set_run_font(run, 14)

        # Article body
        body_para = doc.add_paragraph(article.body_th)
        body_para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        body_para.paragraph_format.first_line_indent = Cm(1.5)
        for run in body_para.runs:
            _set_run_font(run, 14)

        # English translation (if available)
        if article.body_en:
            en_para = doc.add_paragraph(article.body_en)
            en_para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            en_para.paragraph_format.first_line_indent = Cm(1.5)
            for run in en_para.runs:
                _set_run_font(run, 12)
                run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
                run.italic = True

    # ── Signature block ──────────────────────────────────────────────────
    doc.add_paragraph()
    doc.add_paragraph()

    if len(parties) >= 2:
        # Create a signature table
        table = doc.add_table(rows=3, cols=3)
        table.autofit = True

        # Party 1 signature
        table.cell(0, 0).text = "ลงชื่อ ......................................."
        table.cell(1, 0).text = f"( {parties[0].name} )"
        table.cell(2, 0).text = parties[0].role

        # Spacer column
        table.cell(0, 1).text = ""

        # Party 2 signature
        table.cell(0, 2).text = "ลงชื่อ ......................................."
        table.cell(1, 2).text = f"( {parties[1].name} )"
        table.cell(2, 2).text = parties[1].role

        # Center all cells
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    elif len(parties) == 1:
        sig = doc.add_paragraph("ลงชื่อ .......................................")
        sig.alignment = WD_ALIGN_PARAGRAPH.CENTER
        name_para = doc.add_paragraph(f"( {parties[0].name} )")
        name_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # ── Witness block ────────────────────────────────────────────────────
    doc.add_paragraph()
    doc.add_paragraph()

    witness_table = doc.add_table(rows=2, cols=3)
    witness_table.autofit = True
    witness_table.cell(0, 0).text = "ลงชื่อ .......................................พยาน"
    witness_table.cell(1, 0).text = "( ............................................. )"
    witness_table.cell(0, 1).text = ""
    witness_table.cell(0, 2).text = "ลงชื่อ .......................................พยาน"
    witness_table.cell(1, 2).text = "( ............................................. )"

    for row in witness_table.rows:
        for cell in row.cells:
            for para in cell.paragraphs:
                para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # ── Footer ───────────────────────────────────────────────────────────
    doc.add_paragraph()
    footer = doc.add_paragraph("Generated by NeoEM AI Contract Drafting Service")
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in footer.runs:
        _set_run_font(run, 8)
        run.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    # ── Save to bytes ────────────────────────────────────────────────────
    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()
