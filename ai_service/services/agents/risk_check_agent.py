"""
Risk Check Agent — LangChain-powered contract risk analysis pipeline.

Pipeline stages:
  1. OCR (already done before this agent is called)
  2. Clause structuring (Typhoon)
  3. Chat summarisation & context aggregation (Typhoon)
  4. Legal compliance lookup (RAG + Thanoy)
  5. Risk analysis (Typhoon + Thanoy cross-reference)
  6. Response formatting
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage

from models.risk_check import (
    ChatContractMismatch,
    ChatMessage,
    ContractType,
    DealContext,
    ExtractedClause,
    LegalReference,
    OEMFactoryInfo,
    RiskCheckResponse,
    RiskItem,
    RiskLevel,
    StructuredContract,
)
from services.llm.typhoon_client import get_typhoon_llm, typhoon_invoke
from services.llm.thanoy_client import ThanoyClient
from services.llm.prompts import (
    CHAT_SUMMARY_SYSTEM,
    CHAT_SUMMARY_USER,
    CLAUSE_STRUCTURING_SYSTEM,
    CLAUSE_STRUCTURING_USER,
    RISK_ANALYSIS_SYSTEM,
    RISK_ANALYSIS_USER,
)
from services.rag.vector_store import similarity_search

logger = logging.getLogger(__name__)

thanoy = ThanoyClient()


# ═══════════════════════════════════════════════════════════════════════════════
#  STAGE 2: Clause Structuring
# ═══════════════════════════════════════════════════════════════════════════════


async def structure_contract(raw_text: str) -> StructuredContract:
    """Parse raw OCR text into structured clauses using Typhoon."""
    logger.info("Stage 2: Structuring contract text (%d chars)", len(raw_text))

    # Truncate if extremely long (LLM context limit)
    truncated = raw_text[:12000] if len(raw_text) > 12000 else raw_text

    response_text = await typhoon_invoke(
        system_prompt=CLAUSE_STRUCTURING_SYSTEM,
        user_prompt=CLAUSE_STRUCTURING_USER.format(raw_text=truncated),
        temperature=0.05,
    )

    try:
        data = _parse_json_response(response_text)
    except Exception:
        logger.warning("Failed to parse clause structuring JSON, using fallback")
        return StructuredContract(
            raw_text=raw_text,
            contract_type=ContractType.UNKNOWN,
            clauses=[
                ExtractedClause(clause_id="1", title="Full Document", body=raw_text)
            ],
        )

    clauses = [
        ExtractedClause(
            clause_id=str(c.get("clause_id", i + 1)),
            title=c.get("title", f"ข้อ {i + 1}"),
            body=c.get("body", ""),
        )
        for i, c in enumerate(data.get("clauses", []))
    ]

    contract_type_str = data.get("contract_type", "unknown")
    try:
        contract_type = ContractType(contract_type_str)
    except ValueError:
        contract_type = ContractType.UNKNOWN

    return StructuredContract(
        raw_text=raw_text,
        contract_type=contract_type,
        parties=data.get("parties", []),
        effective_date=data.get("effective_date"),
        clauses=clauses,
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  STAGE 3: Context Aggregation (Chat Summary + Factory Info)
# ═══════════════════════════════════════════════════════════════════════════════


async def aggregate_context(
    chat_history: list[ChatMessage],
    factory_info: Optional[OEMFactoryInfo],
) -> DealContext:
    """Summarise chat and merge with factory info."""
    logger.info("Stage 3: Aggregating context from %d messages", len(chat_history))

    # Format chat for prompt
    chat_text = "\n".join(
        f"[{m.sender}] {m.message}" for m in chat_history if m.message.strip()
    )

    if not chat_text:
        chat_text = "(ไม่มีข้อความในแชท)"

    response_text = await typhoon_invoke(
        system_prompt=CHAT_SUMMARY_SYSTEM,
        user_prompt=CHAT_SUMMARY_USER.format(chat_history=chat_text),
        temperature=0.1,
    )

    try:
        data = _parse_json_response(response_text)
    except Exception:
        logger.warning("Failed to parse chat summary JSON")
        data = {"summary": response_text}

    return DealContext(
        chat_summary=data.get("summary", ""),
        agreed_product=data.get("agreed_product"),
        agreed_price=data.get("agreed_price"),
        agreed_quantity=data.get("agreed_quantity"),
        agreed_delivery=data.get("agreed_delivery"),
        factory_name=factory_info.name if factory_info else None,
        factory_certifications=factory_info.certifications if factory_info else [],
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  STAGE 4: Legal Compliance (RAG + Thanoy)
# ═══════════════════════════════════════════════════════════════════════════════


async def get_legal_compliance(
    structured_contract: StructuredContract,
    contract_type: ContractType,
) -> tuple[list[LegalReference], str]:
    """
    Retrieve relevant Thai legal references via RAG and Thanoy.
    Returns (legal_references, thanoy_raw_analysis).
    """
    logger.info("Stage 4: Legal compliance check for %s", contract_type.value)

    # ── 4a. RAG: search legal knowledge base ─────────────────────────────
    topics = _extract_topics(structured_contract)
    query = f"สัญญา {contract_type.value} เกี่ยวกับ {', '.join(topics)} กฎหมายที่เกี่ยวข้อง"

    rag_docs = await similarity_search(query, k=5)
    legal_refs: list[LegalReference] = []

    for doc in rag_docs:
        meta = doc.metadata
        legal_refs.append(
            LegalReference(
                law_name=meta.get("law", "ไม่ระบุ"),
                section=meta.get("sections", "ไม่ระบุ"),
                summary=doc.page_content[:300],
                relevance=meta.get("relevance", ""),
            )
        )

    # ── 4b. Thanoy: legal analysis of key clauses ───────────────────────
    # Send the most important clauses to Thanoy for legal opinion
    thanoy_analysis = ""
    key_clauses = _pick_key_clauses(structured_contract.clauses)

    if key_clauses:
        combined = "\n\n".join(
            f"ข้อ {c.clause_id}: {c.title}\n{c.body[:500]}" for c in key_clauses
        )
        try:
            thanoy_result = await thanoy.consult(
                f"วิเคราะห์ข้อสัญญา OEM ต่อไปนี้ว่ามีความเสี่ยงทางกฎหมายหรือไม่:\n\n{combined}"
            )
            thanoy_analysis = thanoy_result.get("answer", "")
        except Exception as e:
            logger.error("Thanoy consultation failed: %s", str(e))
            thanoy_analysis = f"(Thanoy unavailable: {str(e)})"

    return legal_refs, thanoy_analysis


# ═══════════════════════════════════════════════════════════════════════════════
#  STAGE 5: Risk Analysis (Typhoon cross-reference)
# ═══════════════════════════════════════════════════════════════════════════════


async def analyse_risks(
    structured_contract: StructuredContract,
    deal_context: DealContext,
    legal_refs: list[LegalReference],
    thanoy_analysis: str,
) -> dict:
    """
    Perform the final risk analysis combining all sources.
    Returns parsed risk analysis dict.
    """
    logger.info("Stage 5: Running risk analysis")

    # Serialise inputs for the prompt — truncate aggressively to stay within token limits
    contract_json = json.dumps(
        {
            "contract_type": structured_contract.contract_type.value,
            "parties": structured_contract.parties,
            "effective_date": structured_contract.effective_date,
            "clauses": [
                {"id": c.clause_id, "title": c.title, "body": c.body[:300]}
                for c in structured_contract.clauses[:15]
            ],
        },
        ensure_ascii=False,
        indent=2,
    )

    context_json = json.dumps(
        deal_context.model_dump(),
        ensure_ascii=False,
        indent=2,
    )

    legal_text = "\n".join(
        f"- {ref.law_name} {ref.section}: {ref.summary}" for ref in legal_refs
    )

    response_text = await typhoon_invoke(
        system_prompt=RISK_ANALYSIS_SYSTEM,
        user_prompt=RISK_ANALYSIS_USER.format(
            structured_contract=contract_json,
            deal_context=context_json,
            legal_references=legal_text or "(ไม่พบข้อกฎหมายที่เกี่ยวข้องใน knowledge base)",
            thanoy_analysis=thanoy_analysis or "(Thanoy ไม่สามารถวิเคราะห์ได้)",
        ),
        temperature=0.1,
    )

    try:
        return _parse_json_response(response_text)
    except Exception:
        logger.error("Failed to parse risk analysis JSON")
        return {
            "overall_risk": "medium",
            "risk_score": 50,
            "risks": [],
            "mismatches": [],
            "summary_th": response_text[:500],
            "summary_en": "Risk analysis produced non-JSON output.",
        }


# ═══════════════════════════════════════════════════════════════════════════════
#  FULL PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════


async def run_risk_check_pipeline(
    ocr_result: dict,
    chat_history: list[ChatMessage],
    factory_info: Optional[OEMFactoryInfo] = None,
    language: str = "both",
) -> RiskCheckResponse:
    """
    Execute the full 6-stage risk check pipeline.

    Args:
        ocr_result: Output from OCRService.extract()
        chat_history: Deal room messages
        factory_info: OEM factory profile
        language: 'th' | 'en' | 'both'

    Returns:
        RiskCheckResponse with all findings.
    """
    start = time.time()
    raw_text = ocr_result.get("text", "")

    if not raw_text.strip():
        return RiskCheckResponse(
            overall_risk=RiskLevel.MEDIUM,
            risk_score=50,
            summary_th="ไม่สามารถอ่านข้อความจากเอกสารได้",
            summary_en="Could not extract text from document.",
            processing_time_seconds=time.time() - start,
        )

    # Stage 2: Structure contract
    structured = await structure_contract(raw_text)
    structured.ocr_method = ocr_result.get("method", "unknown")

    # Stage 3: Aggregate context
    context = await aggregate_context(chat_history, factory_info)

    # Stage 4: Legal compliance
    legal_refs, thanoy_analysis = await get_legal_compliance(
        structured, structured.contract_type
    )

    # Stage 5: Risk analysis
    risk_data = await analyse_risks(structured, context, legal_refs, thanoy_analysis)

    # Stage 6: Format response
    risks = _parse_risk_items(risk_data.get("risks", []))
    mismatches = _parse_mismatches(risk_data.get("mismatches", []))

    overall_str = risk_data.get("overall_risk", "medium")
    try:
        overall_risk = RiskLevel(overall_str)
    except ValueError:
        overall_risk = RiskLevel.MEDIUM

    return RiskCheckResponse(
        overall_risk=overall_risk,
        risk_score=float(risk_data.get("risk_score", 50)),
        risks=risks,
        mismatches=mismatches,
        legal_checklist=legal_refs,
        summary_th=risk_data.get("summary_th", ""),
        summary_en=risk_data.get("summary_en", ""),
        contract_type=structured.contract_type,
        structured_contract=structured,
        processing_time_seconds=round(time.time() - start, 2),
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════


def _parse_json_response(text: str) -> dict:
    """Extract JSON from an LLM response that may contain markdown fences."""
    text = text.strip()
    # Remove markdown code fences
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


def _extract_topics(contract: StructuredContract) -> list[str]:
    """Extract topic keywords from a structured contract for RAG search."""
    topics = set()
    type_topic_map = {
        ContractType.SALES: ["ซื้อขาย", "sales"],
        ContractType.HIRE_OF_WORK: ["จ้างทำของ", "hire_of_work", "OEM"],
        ContractType.NDA: ["ความลับ", "nda", "confidentiality"],
        ContractType.DISTRIBUTION: ["ตัวแทนจำหน่าย", "distribution"],
        ContractType.HYBRID_OEM: ["OEM", "จ้างผลิต", "IP"],
    }
    for topic in type_topic_map.get(contract.contract_type, ["OEM", "สัญญา"]):
        topics.add(topic)

    # Scan clause titles for keywords
    ip_keywords = ["ทรัพย์สินทางปัญญา", "IP", "สิทธิบัตร", "ลิขสิทธิ์", "สูตร", "recipe"]
    for clause in contract.clauses:
        combined = f"{clause.title} {clause.body[:200]}".lower()
        if any(kw.lower() in combined for kw in ip_keywords):
            topics.add("ทรัพย์สินทางปัญญา")
        if "penalty" in combined or "ค่าปรับ" in combined or "โทษ" in combined:
            topics.add("บทลงโทษ")
        if "ยกเลิก" in combined or "termination" in combined:
            topics.add("การยกเลิกสัญญา")

    return list(topics) or ["สัญญา OEM"]


def _pick_key_clauses(clauses: list[ExtractedClause], max_clauses: int = 5) -> list[ExtractedClause]:
    """Pick the most legally important clauses for Thanoy analysis."""
    priority_keywords = [
        "ทรัพย์สิน", "IP", "สูตร", "recipe", "สิทธิ",
        "ยกเลิก", "termination",
        "ค่าปรับ", "penalty", "โทษ",
        "ชำระ", "payment", "ราคา",
        "ความลับ", "confidential", "NDA",
        "คุณภาพ", "quality", "QA",
    ]

    scored: list[tuple[int, ExtractedClause]] = []
    for clause in clauses:
        combined = f"{clause.title} {clause.body[:300]}".lower()
        score = sum(1 for kw in priority_keywords if kw.lower() in combined)
        scored.append((score, clause))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [clause for _, clause in scored[:max_clauses]]


def _parse_risk_items(items: list[dict]) -> list[RiskItem]:
    """Parse risk items from LLM output, handling malformed data gracefully."""
    results: list[RiskItem] = []
    for item in items:
        try:
            level_str = item.get("level", "medium")
            try:
                level = RiskLevel(level_str)
            except ValueError:
                level = RiskLevel.MEDIUM

            results.append(
                RiskItem(
                    risk_id=item.get("risk_id", f"R{uuid.uuid4().hex[:6].upper()}"),
                    clause_ref=item.get("clause_ref"),
                    level=level,
                    confidence=float(item.get("confidence", 70)),
                    title_th=item.get("title_th", "ไม่ระบุ"),
                    title_en=item.get("title_en", "Unspecified"),
                    description_th=item.get("description_th", ""),
                    description_en=item.get("description_en", ""),
                    recommendation_th=item.get("recommendation_th", ""),
                    recommendation_en=item.get("recommendation_en", ""),
                    category=item.get("category", "general"),
                    legal_refs=[
                        LegalReference(**ref)
                        for ref in item.get("legal_refs", [])
                        if isinstance(ref, dict)
                    ],
                )
            )
        except Exception as e:
            logger.warning("Skipping malformed risk item: %s", str(e))
    return results


def _parse_mismatches(items: list[dict]) -> list[ChatContractMismatch]:
    """Parse chat-contract mismatches from LLM output."""
    results: list[ChatContractMismatch] = []
    for item in items:
        try:
            severity_str = item.get("severity", "medium")
            try:
                severity = RiskLevel(severity_str)
            except ValueError:
                severity = RiskLevel.MEDIUM

            results.append(
                ChatContractMismatch(
                    field=item.get("field", "unknown"),
                    chat_value=str(item.get("chat_value", "")),
                    contract_value=str(item.get("contract_value", "")),
                    severity=severity,
                )
            )
        except Exception as e:
            logger.warning("Skipping malformed mismatch item: %s", str(e))
    return results
