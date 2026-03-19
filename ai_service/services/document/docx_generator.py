"""
DOCX generator for finalised contracts.
Uses python-docx.
"""

from __future__ import annotations

import io
import logging
import re
from typing import Optional

from docx import Document as DocxDocument
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from models.contract_draft import ContractArticle, PartyInfo

logger = logging.getLogger(__name__)

# Thai font to use in DOCX — the system must have it installed.
_THAI_DOCX_FONT = "Angsana New"

_NUMBERED_PREFIX = re.compile(
    r"^(?:ข้อ\s*\d+|"          # ข้อ 1, ข้อ2
    r"\d+(?:\.\d+)*[\.)]?|"   # 1, 1.1, 1)
    r"\([ก-ฮa-zA-Z0-9]+\)|"    # (ก) (a) (1)
    r"[ก-ฮ][\.)])"              # ก. ก)
)


def _is_structured_line(text: str) -> bool:
    return bool(_NUMBERED_PREFIX.match(text.strip()))


def _iter_paragraphs(text: str) -> list[str]:
    """Normalize text while preserving legal list/new-line structure."""
    if not text:
        return []
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    blocks = re.split(r"\n\s*\n+", normalized)
    paragraphs: list[str] = []

    for block in blocks:
        lines = [part.strip() for part in block.split("\n") if part.strip()]
        if not lines:
            continue

        buffer: list[str] = []
        for line in lines:
            line = re.sub(r"[ \t]{2,}", " ", line).strip()
            if not line:
                continue

            if _is_structured_line(line):
                if buffer:
                    paragraphs.append(" ".join(buffer).strip())
                    buffer = []
                paragraphs.append(line)
            else:
                buffer.append(line)

        if buffer:
            paragraphs.append(" ".join(buffer).strip())

    return paragraphs


def _set_run_font(run, size: int, font_name: str = _THAI_DOCX_FONT):
    """Set font name and size on a python-docx Run."""
    run.font.name = font_name
    run.font.size = Pt(size)


def _resolve_paragraph_alignment(text: str):
    """Prefer Thai-justify, fallback when text has too few natural break points."""
    thai_justify = getattr(WD_ALIGN_PARAGRAPH, "THAI_JUSTIFY", WD_ALIGN_PARAGRAPH.JUSTIFY)
    if text.count(" ") >= 2:
        return thai_justify
    return WD_ALIGN_PARAGRAPH.LEFT


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
        for para_text in _iter_paragraphs(preamble):
            preamble_para = doc.add_paragraph(para_text)
            preamble_para.alignment = _resolve_paragraph_alignment(para_text)
            preamble_para.paragraph_format.first_line_indent = Cm(0)
            preamble_para.paragraph_format.space_after = Pt(3)
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
        for para_text in _iter_paragraphs(article.body_th):
            body_para = doc.add_paragraph(para_text)
            body_para.alignment = _resolve_paragraph_alignment(para_text)
            body_para.paragraph_format.first_line_indent = Cm(0)
            body_para.paragraph_format.space_after = Pt(2)
            for run in body_para.runs:
                _set_run_font(run, 14)

        # Keep DOCX content aligned with PDF output: Thai-only body content.

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
