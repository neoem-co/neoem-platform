"""
Curated retrieval for contract drafting.

This is a local retrieval layer used during draft generation. It pulls from a
small, approved corpus of Thai legal authorities, clause patterns, and exemplar
snippets so generation is grounded without relying on large verbatim contract
copies.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

from models.contract_draft import DealSheet, PartyInfo, ProductInfo

logger = logging.getLogger(__name__)

_CORPUS_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "drafting_corpus.json"
_TOKEN_RE = re.compile(r"[A-Za-z0-9ก-๙]+")

_DEFAULT_TOPICS: dict[str, list[str]] = {
    "sales_contract": [
        "definitions",
        "scope",
        "price_payment",
        "delivery",
        "quality_qc",
        "warranty_liability",
        "termination",
        "dispute_resolution",
        "general",
    ],
    "hire_of_work": [
        "definitions",
        "scope",
        "price_payment",
        "delivery",
        "quality_qc",
        "ip",
        "confidentiality",
        "termination",
        "penalty",
        "dispute_resolution",
        "general",
    ],
    "hybrid_oem": [
        "definitions",
        "scope",
        "price_payment",
        "delivery",
        "quality_qc",
        "ip",
        "confidentiality",
        "termination",
        "penalty",
        "regulatory_fda",
        "annex",
        "signature",
    ],
    "distribution": [
        "scope",
        "price_payment",
        "territory",
        "trademark",
        "termination",
        "dispute_resolution",
        "general",
    ],
    "nda": [
        "definitions",
        "confidentiality",
        "ip",
        "termination",
        "dispute_resolution",
        "general",
    ],
}

_RELATED_TEMPLATE_TYPES: dict[str, set[str]] = {
    "hire_of_work": {"hire_of_work", "hybrid_oem"},
    "hybrid_oem": {"hybrid_oem", "hire_of_work", "sales_contract"},
    "sales_contract": {"sales_contract", "hybrid_oem"},
    "distribution": {"distribution"},
    "nda": {"nda", "hybrid_oem"},
}


@dataclass(frozen=True)
class DraftingSnippet:
    id: str
    title: str
    content_th: str
    doc_role: str
    reuse_mode: str
    clause_topic: str
    contract_types: tuple[str, ...]
    industry: str
    language: str = "th"
    jurisdiction: str = "thailand"
    risk_side: str = "balanced"
    source: str = ""
    score: float = 0.0


@dataclass
class DraftingRetrievalContext:
    query: str
    industry: str
    legal_authorities: list[DraftingSnippet] = field(default_factory=list)
    clause_patterns: list[DraftingSnippet] = field(default_factory=list)
    approved_exemplars: list[DraftingSnippet] = field(default_factory=list)

    def as_prompt_sections(self) -> dict[str, str]:
        return {
            "legal_authorities": _format_snippet_block(self.legal_authorities),
            "clause_patterns": _format_snippet_block(self.clause_patterns),
            "approved_exemplars": _format_snippet_block(self.approved_exemplars),
        }

    def as_debug_payload(self) -> dict[str, list[dict[str, str]]]:
        def _serialize(items: list[DraftingSnippet]) -> list[dict[str, str]]:
            return [
                {
                    "id": item.id,
                    "title": item.title,
                    "doc_role": item.doc_role,
                    "reuse_mode": item.reuse_mode,
                    "clause_topic": item.clause_topic,
                    "contract_types": ", ".join(item.contract_types),
                    "industry": item.industry,
                    "language": item.language,
                    "jurisdiction": item.jurisdiction,
                    "risk_side": item.risk_side,
                    "source": item.source,
                    "score": f"{item.score:.2f}",
                }
                for item in items
            ]

        return {
            "legal_authorities": _serialize(self.legal_authorities),
            "clause_patterns": _serialize(self.clause_patterns),
            "approved_exemplars": _serialize(self.approved_exemplars),
        }


@lru_cache(maxsize=1)
def _load_corpus() -> list[dict[str, Any]]:
    content = _CORPUS_PATH.read_text(encoding="utf-8")
    return json.loads(content)


def _format_snippet_block(snippets: list[DraftingSnippet]) -> str:
    if not snippets:
        return "- ไม่มีข้อมูลค้นคืนเพิ่มเติม"

    blocks: list[str] = []
    for idx, item in enumerate(snippets, start=1):
        line = (
            f"{idx}. [{item.reuse_mode}] {item.title}\n"
            f"หัวข้อ: {item.clause_topic}\n"
            f"{item.content_th}"
        )
        if item.source:
            line += f"\nที่มา: {item.source}"
        blocks.append(line)
    return "\n\n".join(blocks)


def _tokenize(text: str) -> set[str]:
    return {token.lower() for token in _TOKEN_RE.findall(text or "") if len(token) >= 2}


def _infer_industry(text: str) -> str:
    lowered = text.lower()
    if any(keyword in lowered for keyword in ("serum", "sunscreen", "cream", "cosmetic", "เครื่องสำอาง", "สกิน", "โลชั่น")):
        return "cosmetics"
    if any(keyword in lowered for keyword in ("supplement", "capsule", "tablet", "อาหารเสริม", "วิตามิน", "ชงดื่ม")):
        return "supplements"
    return "all"


def _build_focus_topics(template_type: str, deal_sheet: DealSheet, product: ProductInfo | None) -> set[str]:
    topics = set(_DEFAULT_TOPICS.get(template_type, _DEFAULT_TOPICS["hybrid_oem"]))
    product_text = " ".join(filter(None, [
        product.name if product else "",
        product.specs if product else "",
        product.packaging if product else "",
        product.target_market if product else "",
        deal_sheet.delivery_address or "",
        deal_sheet.additional_notes or "",
    ])).lower()
    industry = _infer_industry(product_text)
    if industry in {"cosmetics", "supplements"}:
        topics.add("regulatory_fda")

    if deal_sheet.commercial_terms:
        topics.add("ip")
        topics.add("penalty")

    if deal_sheet.delivery_date or deal_sheet.delivery_weeks:
        topics.add("delivery")

    if deal_sheet.total_price is not None:
        topics.add("price_payment")

    if deal_sheet.payment_milestones:
        topics.add("price_payment")

    if deal_sheet.quality_terms:
        topics.add("quality_qc")

    if deal_sheet.regulatory_terms:
        topics.add("regulatory_fda")

    return topics


def _build_query(
    template_type: str,
    deal_sheet: DealSheet,
    parties: list[PartyInfo],
    product: ProductInfo | None,
) -> tuple[str, set[str], set[str], str]:
    chosen_product = product or deal_sheet.product
    chosen_parties = parties or [party for party in [deal_sheet.client, deal_sheet.vendor] if party]
    product_bits = [
        chosen_product.name if chosen_product else "",
        chosen_product.specs if chosen_product else "",
        chosen_product.packaging if chosen_product else "",
        chosen_product.target_market if chosen_product else "",
        deal_sheet.additional_notes or "",
        deal_sheet.delivery_weeks or "",
        deal_sheet.delivery_date or "",
        deal_sheet.delivery_address or "",
    ]

    commercial_bits: list[str] = []
    if deal_sheet.commercial_terms:
        commercial_bits.extend(
            [
                str(deal_sheet.commercial_terms.commercial_type),
                str(deal_sheet.commercial_terms.ip_ownership),
                deal_sheet.commercial_terms.ip_details or "",
                str(deal_sheet.commercial_terms.penalty_type),
                deal_sheet.commercial_terms.penalty_details or "",
                deal_sheet.commercial_terms.payment_terms_summary or "",
                deal_sheet.commercial_terms.artwork_ownership or "",
                deal_sheet.commercial_terms.tooling_ownership or "",
                deal_sheet.commercial_terms.termination_trigger or "",
                str(deal_sheet.commercial_terms.lead_time_days or ""),
                "tooling return" if deal_sheet.commercial_terms.tooling_return_required else "",
            ]
        )

    payment_bits = [
        " ".join(
            filter(
                None,
                [
                    milestone.label,
                    milestone.due_event or "",
                    milestone.notes or "",
                    str(milestone.amount_percentage or ""),
                    str(milestone.amount_fixed or ""),
                ],
            )
        )
        for milestone in deal_sheet.payment_milestones
    ]

    quality_bits: list[str] = []
    if deal_sheet.quality_terms:
        quality_bits.extend(
            [
                *deal_sheet.quality_terms.standards,
                deal_sheet.quality_terms.qc_basis or "",
                deal_sheet.quality_terms.defect_remedy or "",
                str(deal_sheet.quality_terms.acceptance_window_days or ""),
                str(deal_sheet.quality_terms.warranty_period_days or ""),
            ]
        )

    regulatory_bits: list[str] = []
    if deal_sheet.regulatory_terms:
        regulatory_bits.extend(
            [
                deal_sheet.regulatory_terms.registration_owner or "",
                deal_sheet.regulatory_terms.document_support_by or "",
                deal_sheet.regulatory_terms.label_compliance_owner or "",
                deal_sheet.regulatory_terms.target_market or "",
                deal_sheet.regulatory_terms.notes or "",
            ]
        )

    party_bits = [
        " ".join(filter(None, [party.role, party.name, party.company or ""]))
        for party in chosen_parties
    ]

    query = " ".join(
        bit for bit in [
            template_type,
            *party_bits,
            *product_bits,
            *commercial_bits,
            *payment_bits,
            *quality_bits,
            *regulatory_bits,
            "OEM ไทย สัญญา กฎหมาย คุณภาพ ส่งมอบ ชำระเงิน ทรัพย์สินทางปัญญา การรักษาความลับ เลิกสัญญา พยาน เอกสารแนบท้าย",
        ] if bit
    )
    tokens = _tokenize(query)
    topics = _build_focus_topics(template_type, deal_sheet, chosen_product)
    industry = _infer_industry(query)
    return query, tokens, topics, industry


def _score_record(
    record: dict[str, Any],
    template_type: str,
    query_tokens: set[str],
    focus_topics: set[str],
    industry: str,
) -> float:
    score = 0.0

    contract_types = {value.lower() for value in record.get("contract_types", [])}
    compatible_types = _RELATED_TEMPLATE_TYPES.get(template_type, {template_type})
    if template_type in contract_types:
        score += 8.0
    elif contract_types & compatible_types:
        score += 5.5
    elif "all" in contract_types:
        score += 2.0
    else:
        return 0.0

    record_industry = str(record.get("industry") or "all").lower()
    if record_industry == industry:
        score += 3.5
    elif record_industry == "all" or industry == "all":
        score += 1.0

    language = str(record.get("language") or "th").lower()
    if language in {"th", "thai", "both"}:
        score += 0.6

    jurisdiction = str(record.get("jurisdiction") or "thailand").lower()
    if jurisdiction in {"thailand", "thai", "all"}:
        score += 0.8

    risk_side = str(record.get("risk_side") or "balanced").lower()
    if risk_side == "balanced":
        score += 0.6
    elif risk_side in query_tokens:
        score += 0.4

    clause_topic = str(record.get("clause_topic") or "").lower()
    if clause_topic in focus_topics:
        score += 3.0

    search_text = " ".join(
        [
            str(record.get("title") or ""),
            str(record.get("content_th") or ""),
            " ".join(record.get("keywords", [])),
            clause_topic,
            record_industry,
        ]
    )
    search_tokens = _tokenize(search_text)
    overlap = len(query_tokens & search_tokens)
    score += min(overlap * 0.9, 6.0)

    if record.get("doc_role") == "legal_authority":
        score += 0.6

    return score


def _to_snippet(record: dict[str, Any], score: float) -> DraftingSnippet:
    return DraftingSnippet(
        id=str(record["id"]),
        title=str(record["title"]),
        content_th=str(record["content_th"]),
        doc_role=str(record["doc_role"]),
        reuse_mode=str(record["reuse_mode"]),
        clause_topic=str(record.get("clause_topic") or ""),
        contract_types=tuple(str(item) for item in record.get("contract_types", [])),
        industry=str(record.get("industry") or "all"),
        language=str(record.get("language") or "th"),
        jurisdiction=str(record.get("jurisdiction") or "thailand"),
        risk_side=str(record.get("risk_side") or "balanced"),
        source=str(record.get("source") or ""),
        score=score,
    )


def retrieve_drafting_context(
    template_type: str,
    deal_sheet: DealSheet,
    parties: list[PartyInfo],
    product: ProductInfo | None = None,
) -> DraftingRetrievalContext:
    """
    Retrieve a bounded drafting context from the local curated corpus.

    The result is grouped into legal authorities, clause patterns, and approved
    exemplar snippets for prompt injection and logging.
    """

    query, tokens, topics, industry = _build_query(template_type, deal_sheet, parties, product)
    scored: list[DraftingSnippet] = []

    for record in _load_corpus():
        score = _score_record(record, template_type, tokens, topics, industry)
        if score <= 0:
            continue
        scored.append(_to_snippet(record, score))

    scored.sort(key=lambda item: item.score, reverse=True)

    legal_authorities = [item for item in scored if item.doc_role == "legal_authority"][:3]
    clause_patterns = [item for item in scored if item.doc_role == "clause_pattern"][:4]
    approved_exemplars = [item for item in scored if item.doc_role == "approved_exemplar"][:3]

    logger.info(
        "Draft retrieval for %s yielded %d legal authorities, %d clause patterns, %d exemplars",
        template_type,
        len(legal_authorities),
        len(clause_patterns),
        len(approved_exemplars),
    )

    return DraftingRetrievalContext(
        query=query,
        industry=industry,
        legal_authorities=legal_authorities,
        clause_patterns=clause_patterns,
        approved_exemplars=approved_exemplars,
    )
