"""
Shared Thai legal document layout profile.

The contract drafting pipeline uses one internal profile so DOCX and PDF
generation follow the same spacing, indentation, and signature rules.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ThaiLegalLayoutProfile:
    """A single shared layout profile for Thai legal contracts."""

    page_width_mm: float = 210.0
    page_height_mm: float = 297.0

    margin_top_mm: float = 20.0
    margin_bottom_mm: float = 20.0
    margin_left_mm: float = 25.0
    margin_right_mm: float = 25.0

    pdf_font_family: str = "Sarabun"
    docx_font_name: str = "TH Sarabun New"
    docx_font_fallback: str = "Angsana New"

    title_font_size_pt: int = 18
    date_font_size_pt: int = 11
    body_font_size_pt: int = 14
    heading_font_size_pt: int = 14
    footer_font_size_pt: int = 8

    pdf_line_height_mm: float = 6.8
    title_gap_after_mm: float = 3.0
    date_gap_after_mm: float = 5.0
    heading_gap_before_mm: float = 5.0
    heading_gap_after_mm: float = 2.0
    paragraph_gap_after_mm: float = 1.8
    section_gap_after_mm: float = 3.5

    first_line_indent_mm: float = 10.0
    list_indent_mm: float = 6.0
    list_gap_after_prefix_mm: float = 2.0

    signature_top_gap_mm: float = 12.0
    witness_top_gap_mm: float = 10.0
    signature_row_gap_mm: float = 3.0

    justify_min_fill_ratio: float = 0.78
    justify_max_extra_gap_mm: float = 1.15

    heading_center_ratio: float = 0.78
    heading_reduce_ratio: float = 0.88

    docx_line_spacing: float = 1.15
    docx_title_space_after_pt: float = 6.0
    docx_date_space_after_pt: float = 8.0
    docx_heading_space_before_pt: float = 10.0
    docx_heading_space_after_pt: float = 4.0
    docx_paragraph_space_after_pt: float = 3.0
    docx_first_line_indent_cm: float = 0.9
    docx_list_left_indent_cm: float = 0.95
    docx_list_hanging_cm: float = 0.65

    signature_spacer_ratio: float = 0.12

    @property
    def content_width_mm(self) -> float:
        return self.page_width_mm - self.margin_left_mm - self.margin_right_mm


_DEFAULT_PROFILE = ThaiLegalLayoutProfile()


def get_default_thai_legal_layout_profile() -> ThaiLegalLayoutProfile:
    """Return the default layout profile used across DOCX/PDF renderers."""

    return _DEFAULT_PROFILE
