"""
PDF generator for finalised contracts.

Uses fpdf2 with HarfBuzz text shaping plus Thai-aware token wrapping so body
paragraphs stay within the printable area and justify cleanly for demo output.
"""

from __future__ import annotations

import logging
import os
import re
import unicodedata
from typing import Optional

from fpdf import FPDF

from models.contract_draft import ContractArticle, PartyInfo
from services.document.layout_profile import (
    ThaiLegalLayoutProfile,
    get_default_thai_legal_layout_profile,
)

logger = logging.getLogger(__name__)

_THAI_CHAR_RE = re.compile(r"[\u0E00-\u0E7F]")
_NUMBERED_PREFIX = re.compile(
    r"^(?:ข้อ\s*\d+|"
    r"\d+(?:\.\d+)*[\.)]?|"
    r"\([ก-๙a-zA-Z0-9]+\)|"
    r"[ก-๙][\.)])"
)
_STRUCTURED_PREFIX = re.compile(
    r"^(?P<prefix>(?:\d+(?:\.\d+)*[\.)]?|\([ก-๙a-zA-Z0-9]+\)|[ก-๙][\.)]))\s*"
)
_NON_SPACE_CHUNK_RE = re.compile(
    r"[A-Za-z0-9]+(?:[./:_-][A-Za-z0-9]+)*|[\u0E00-\u0E7F]+|[^\s]"
)
_THAI_COMBINING_MARKS = {
    "\u0E31",
    "\u0E34",
    "\u0E35",
    "\u0E36",
    "\u0E37",
    "\u0E38",
    "\u0E39",
    "\u0E3A",
    "\u0E47",
    "\u0E48",
    "\u0E49",
    "\u0E4A",
    "\u0E4B",
    "\u0E4C",
    "\u0E4D",
    "\u0E4E",
}

try:
    from pythainlp.tokenize import word_tokenize as _thai_word_tokenize
except Exception:
    _thai_word_tokenize = None

_FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "fonts")
_FONT_REGULAR = os.path.join(_FONT_DIR, "Sarabun-Regular.ttf")
_FONT_BOLD = os.path.join(_FONT_DIR, "Sarabun-Bold.ttf")


class _ContractPDF(FPDF):
    """Thin subclass to add a page-number footer."""

    def __init__(self, profile: ThaiLegalLayoutProfile):
        super().__init__(format="A4")
        self.profile = profile

    def footer(self):
        self.set_y(-15)
        self.set_font(self.profile.pdf_font_family, "", 9)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, f"- {self.page_no()} -", align="C")
        self.set_text_color(0, 0, 0)


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

    profile = get_default_thai_legal_layout_profile()
    pdf = _ContractPDF(profile)
    pdf.set_text_shaping(True)

    pdf.add_font(profile.pdf_font_family, "", _FONT_REGULAR)
    pdf.add_font(profile.pdf_font_family, "B", _FONT_BOLD)

    pdf.set_margins(profile.margin_left_mm, profile.margin_top_mm, profile.margin_right_mm)
    pdf.set_auto_page_break(True, margin=profile.margin_bottom_mm)
    pdf.add_page()
    pdf.c_margin = 0

    pdf.set_font(profile.pdf_font_family, "B", profile.title_font_size_pt)
    pdf.multi_cell(
        w=profile.content_width_mm,
        h=profile.pdf_line_height_mm,
        text=title,
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(profile.title_gap_after_mm)

    if effective_date:
        pdf.set_font(profile.pdf_font_family, "", profile.date_font_size_pt)
        pdf.cell(
            w=profile.content_width_mm,
            h=profile.pdf_line_height_mm,
            text=f"ลงวันที่ {effective_date}",
            align="C",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        pdf.ln(profile.date_gap_after_mm)

    pdf.set_font(profile.pdf_font_family, "", profile.body_font_size_pt)
    if preamble:
        for para_text in _iter_paragraphs(preamble):
            _write_paragraph(pdf, para_text, profile, first_offset_mm=0.0, other_offset_mm=0.0)
        pdf.ln(profile.section_gap_after_mm)

    for article in articles:
        pdf.ln(profile.heading_gap_before_mm)
        pdf.set_font(profile.pdf_font_family, "B", profile.heading_font_size_pt)
        _write_article_heading(pdf, f"ข้อ {article.article_number}  {article.title_th}", profile)
        pdf.ln(profile.heading_gap_after_mm)

        pdf.set_font(profile.pdf_font_family, "", profile.body_font_size_pt)
        for para_text in _iter_paragraphs(article.body_th.strip()):
            _write_paragraph(
                pdf,
                para_text,
                profile,
                first_offset_mm=profile.first_line_indent_mm,
                other_offset_mm=0.0,
            )
        pdf.ln(profile.section_gap_after_mm)

    pdf.ln(profile.signature_top_gap_mm)
    pdf.set_font(profile.pdf_font_family, "", profile.body_font_size_pt)

    if len(parties) >= 2:
        _draw_signature_pair(pdf, parties[0], parties[1], profile)
    elif len(parties) == 1:
        _draw_signature_pair(
            pdf,
            parties[0],
            PartyInfo(name="........................................", role="counterparty"),
            profile,
        )

    pdf.ln(profile.witness_top_gap_mm)
    _draw_signature_pair(
        pdf,
        PartyInfo(name="........................................", role="witness"),
        PartyInfo(name="........................................", role="witness"),
        profile,
    )

    pdf.ln(profile.signature_top_gap_mm)
    pdf.set_font(profile.pdf_font_family, "", profile.footer_font_size_pt)
    pdf.set_text_color(160, 160, 160)
    pdf.cell(
        w=profile.content_width_mm,
        text="Generated by neoem AI Contract Drafting Service",
        align="C",
    )
    pdf.set_text_color(0, 0, 0)

    return pdf.output()


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

            if _NUMBERED_PREFIX.match(line):
                if buffer:
                    paragraphs.append(" ".join(buffer).strip())
                    buffer = []
                paragraphs.append(line)
            else:
                buffer.append(line)

        if buffer:
            paragraphs.append(" ".join(buffer).strip())

    return paragraphs


def _split_non_space_chunk(chunk: str) -> list[str]:
    if not chunk:
        return []

    if _thai_word_tokenize and len(_THAI_CHAR_RE.findall(chunk)) >= 4:
        try:
            tokens = [token for token in _thai_word_tokenize(chunk, keep_whitespace=False) if token]
            if tokens:
                split_tokens: list[str] = []
                for token in tokens:
                    split_tokens.extend(_NON_SPACE_CHUNK_RE.findall(token) or [token])
                if split_tokens:
                    return split_tokens
        except Exception:
            logger.debug("Thai tokenizer fallback triggered for chunk of length %d", len(chunk))

    return _NON_SPACE_CHUNK_RE.findall(chunk) or [chunk]


def _tokenize_for_wrap(text: str) -> list[str]:
    normalized = text.replace("\t", "    ").strip()
    if not normalized:
        return []

    tokens: list[str] = []
    for segment in re.findall(r"\s+|\S+", normalized):
        if segment.isspace():
            if tokens and not tokens[-1].isspace():
                tokens.append(" ")
            continue
        tokens.extend(_split_non_space_chunk(segment))
    return tokens


def _measure_token(pdf: FPDF, token: str) -> float:
    return pdf.get_string_width(token)


def _is_combining_mark(char: str) -> bool:
    return unicodedata.combining(char) != 0 or char in _THAI_COMBINING_MARKS


def _iter_text_clusters(text: str) -> list[str]:
    clusters: list[str] = []
    current = ""
    for char in text:
        if not current:
            current = char
            continue
        if _is_combining_mark(char):
            current += char
            continue
        clusters.append(current)
        current = char
    if current:
        clusters.append(current)
    return clusters or [text]


def _split_token_to_fit(pdf: FPDF, token: str, max_width: float) -> list[str]:
    if not token or token.isspace() or _measure_token(pdf, token) <= max_width:
        return [token]

    pieces: list[str] = []
    current = ""
    for cluster in _iter_text_clusters(token):
        candidate = current + cluster
        if current and _measure_token(pdf, candidate) > max_width:
            pieces.append(current)
            current = cluster
            continue
        current = candidate

    if current:
        pieces.append(current)

    return pieces or [token]


def _prepare_tokens_for_wrap(
    pdf: FPDF,
    tokens: list[str],
    first_width: float,
    other_width: float,
) -> list[str]:
    safe_width = max(min(first_width, other_width), 1.0)
    prepared: list[str] = []
    for token in tokens:
        if not token:
            continue
        if token.isspace():
            if prepared and not prepared[-1].isspace():
                prepared.append(" ")
            continue
        prepared.extend(_split_token_to_fit(pdf, token, safe_width))
    return prepared


def _trim_line_tokens(tokens: list[str]) -> list[str]:
    trimmed = list(tokens)
    while trimmed and trimmed[-1].isspace():
        trimmed.pop()
    return trimmed


def _wrap_tokens(
    pdf: FPDF,
    tokens: list[str],
    first_width: float,
    other_width: float,
) -> list[list[str]]:
    prepared = _prepare_tokens_for_wrap(pdf, tokens, first_width, other_width)
    lines: list[list[str]] = []
    current: list[str] = []
    current_width = 0.0
    width_limit = first_width

    for token in prepared:
        if not token:
            continue

        token_width = _measure_token(pdf, token)
        is_space = token.isspace()

        if not current and is_space:
            continue

        if current and current_width + token_width > width_limit:
            trimmed = _trim_line_tokens(current)
            if trimmed:
                lines.append(trimmed)
                width_limit = other_width
            current = []
            current_width = 0.0

            if is_space:
                continue

        current.append(token)
        current_width += token_width

    trimmed = _trim_line_tokens(current)
    if trimmed:
        lines.append(trimmed)

    return lines


def _line_parts(pdf: FPDF, tokens: list[str]) -> tuple[list[str], list[float], float]:
    parts: list[str] = []
    gap_widths: list[float] = []
    pending_gap = 0.0

    for token in tokens:
        if token.isspace():
            pending_gap += _measure_token(pdf, token)
            continue

        if parts:
            gap_widths.append(pending_gap)
        parts.append(token)
        pending_gap = 0.0

    content_width = sum(_measure_token(pdf, part) for part in parts) + sum(gap_widths)
    return parts, gap_widths, content_width


def _can_safely_justify_line(
    pdf: FPDF,
    tokens: list[str],
    available_width: float,
    profile: ThaiLegalLayoutProfile,
) -> bool:
    parts, gap_widths, line_width = _line_parts(pdf, tokens)
    gap_count = len(gap_widths)
    if len(parts) < 2 or gap_count < 1 or line_width <= 0:
        return False

    fill_ratio = line_width / max(available_width, 1.0)
    if fill_ratio < profile.justify_min_fill_ratio:
        return False

    extra = available_width - line_width
    if extra <= 0:
        return False

    return (extra / gap_count) <= profile.justify_max_extra_gap_mm


def _write_left_aligned_line(
    pdf: FPDF,
    tokens: list[str],
    x: float,
    width: float,
    line_height: float,
) -> None:
    pdf.set_x(x)
    pdf.cell(
        w=width,
        h=line_height,
        text="".join(tokens).strip(),
        align="L",
        new_x="LMARGIN",
        new_y="NEXT",
    )


def _write_justified_line(
    pdf: FPDF,
    tokens: list[str],
    x: float,
    width: float,
    line_height: float,
) -> None:
    parts, gap_widths, line_width = _line_parts(pdf, tokens)
    if len(parts) < 2 or not gap_widths:
        _write_left_aligned_line(pdf, tokens, x, width, line_height)
        return

    extra_per_gap = max((width - line_width) / len(gap_widths), 0.0)
    y = pdf.get_y()
    original_margin = pdf.c_margin
    pdf.c_margin = 0
    pdf.set_xy(x, y)

    right_edge = x + width
    for idx, part in enumerate(parts):
        part_width = max(_measure_token(pdf, part), 0.01)
        pdf.cell(w=part_width, h=line_height, text=part)
        if idx < len(gap_widths):
            next_x = pdf.get_x() + gap_widths[idx] + extra_per_gap
            pdf.set_x(min(next_x, right_edge))

    pdf.c_margin = original_margin
    pdf.set_xy(pdf.l_margin, y + line_height)


def _write_wrapped_lines(
    pdf: FPDF,
    lines: list[list[str]],
    profile: ThaiLegalLayoutProfile,
    *,
    first_offset_mm: float,
    other_offset_mm: float,
    prefer_justify: bool,
) -> None:
    for idx, line in enumerate(lines):
        offset = first_offset_mm if idx == 0 else other_offset_mm
        available_width = max(profile.content_width_mm - offset, 1.0)
        x = profile.margin_left_mm + offset
        measured_width = pdf.get_string_width("".join(line).strip())
        if measured_width > available_width + 0.2:
            logger.warning(
                "PDF line width exceeded available width (%.2f > %.2f) after wrapping",
                measured_width,
                available_width,
            )

        should_justify = (
            prefer_justify
            and idx < len(lines) - 1
            and _can_safely_justify_line(pdf, line, available_width, profile)
        )
        if should_justify:
            _write_justified_line(pdf, line, x, available_width, profile.pdf_line_height_mm)
        else:
            _write_left_aligned_line(pdf, line, x, available_width, profile.pdf_line_height_mm)


def _write_paragraph(
    pdf: FPDF,
    text: str,
    profile: ThaiLegalLayoutProfile,
    *,
    first_offset_mm: float,
    other_offset_mm: float,
) -> None:
    if not text.strip():
        return

    structured_match = _STRUCTURED_PREFIX.match(text)
    if structured_match:
        prefix = structured_match.group("prefix").strip()
        remainder = text[structured_match.end():].strip()
        base_offset = profile.list_indent_mm
        prefix_width = pdf.get_string_width(prefix) + profile.list_gap_after_prefix_mm

        y = pdf.get_y()
        pdf.set_xy(profile.margin_left_mm + base_offset, y)
        pdf.cell(w=pdf.get_string_width(prefix), h=profile.pdf_line_height_mm, text=prefix)

        if remainder:
            remainder_tokens = _tokenize_for_wrap(remainder)
            remainder_lines = _wrap_tokens(
                pdf,
                remainder_tokens,
                profile.content_width_mm - (base_offset + prefix_width),
                profile.content_width_mm - (base_offset + prefix_width),
            )
            _write_wrapped_lines(
                pdf,
                remainder_lines,
                profile,
                first_offset_mm=base_offset + prefix_width,
                other_offset_mm=base_offset + prefix_width,
                prefer_justify=True,
            )
        else:
            pdf.set_xy(pdf.l_margin, y + profile.pdf_line_height_mm)
    else:
        lines = _wrap_tokens(
            pdf,
            _tokenize_for_wrap(text),
            profile.content_width_mm - first_offset_mm,
            profile.content_width_mm - other_offset_mm,
        )
        _write_wrapped_lines(
            pdf,
            lines,
            profile,
            first_offset_mm=first_offset_mm,
            other_offset_mm=other_offset_mm,
            prefer_justify=True,
        )

    pdf.ln(profile.paragraph_gap_after_mm)


def _write_article_heading(pdf: FPDF, heading: str, profile: ThaiLegalLayoutProfile) -> None:
    current_size = profile.heading_font_size_pt
    width = pdf.get_string_width(heading)

    if width <= profile.content_width_mm * profile.heading_center_ratio:
        pdf.cell(
            w=profile.content_width_mm,
            h=profile.pdf_line_height_mm,
            text=heading,
            align="C",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        return

    if width <= profile.content_width_mm * profile.heading_reduce_ratio:
        current_size = max(profile.heading_font_size_pt - 1, 12)
        pdf.set_font(profile.pdf_font_family, "B", current_size)
        pdf.cell(
            w=profile.content_width_mm,
            h=profile.pdf_line_height_mm,
            text=heading,
            align="C",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        pdf.set_font(profile.pdf_font_family, "B", profile.heading_font_size_pt)
        return

    lines = _wrap_tokens(
        pdf,
        _tokenize_for_wrap(heading),
        profile.content_width_mm,
        profile.content_width_mm,
    )
    _write_wrapped_lines(
        pdf,
        lines,
        profile,
        first_offset_mm=0.0,
        other_offset_mm=0.0,
        prefer_justify=False,
    )


def _party_display_name(party: PartyInfo) -> str:
    return (party.company or party.name or "........................................").strip()


def _party_role_label(party: PartyInfo) -> str:
    role = (party.role or "").lower()
    mapping = {
        "buyer": "ผู้ว่าจ้าง",
        "client": "ผู้ว่าจ้าง",
        "seller": "ผู้รับจ้าง",
        "vendor": "ผู้รับจ้าง",
        "factory": "ผู้รับจ้าง",
        "witness": "พยาน",
    }
    return mapping.get(role, "คู่สัญญา")


def _draw_signature_pair(
    pdf: FPDF,
    left: PartyInfo,
    right: PartyInfo,
    profile: ThaiLegalLayoutProfile,
) -> None:
    spacer_width = profile.content_width_mm * profile.signature_spacer_ratio
    signer_width = (profile.content_width_mm - spacer_width) / 2
    right_x = profile.margin_left_mm + signer_width + spacer_width

    rows = [
        ("ลงชื่อ ................................................", "ลงชื่อ ................................................"),
        (f"( {_party_display_name(left)} )", f"( {_party_display_name(right)} )"),
        (_party_role_label(left), _party_role_label(right)),
    ]

    for left_text, right_text in rows:
        y = pdf.get_y()
        pdf.set_xy(profile.margin_left_mm, y)
        pdf.cell(w=signer_width, h=profile.pdf_line_height_mm, text=left_text, align="C")
        pdf.set_xy(right_x, y)
        pdf.cell(
            w=signer_width,
            h=profile.pdf_line_height_mm,
            text=right_text,
            align="C",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        pdf.ln(profile.signature_row_gap_mm)
