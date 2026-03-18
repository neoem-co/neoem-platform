"""
API router for the Contract Risk Check service.
"""

from __future__ import annotations

import json
import logging
import time

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from models.risk_check import (
    ChatMessage,
    OEMFactoryInfo,
    RiskCheckRequest,
    RiskCheckResponse,
)
from services.ocr.iapp_ocr import OCRService
from services.agents.risk_check_agent import run_risk_check_pipeline
from services.llm.typhoon_client import typhoon_invoke
from services.llm.prompts import RISK_EXPLAIN_SYSTEM, RISK_EXPLAIN_USER

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai/risk-check", tags=["Risk Check"])


@router.post("/analyze", response_model=RiskCheckResponse)
async def analyze_contract(
    file: UploadFile = File(..., description="Contract PDF file"),
    chat_history: Optional[str] = Form(
        default="[]",
        description="JSON array of chat messages: [{sender, message, timestamp}]",
    ),
    factory_info: Optional[str] = Form(
        default=None,
        description="JSON object with factory profile info",
    ),
    language: str = Form(default="both", description="'th' | 'en' | 'both'"),
):
    """
    Full contract risk analysis pipeline.

    Upload a PDF and optionally provide chat history + factory info.
    Returns risk items, overall score, mismatches, and legal references.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(400, "No file provided")

    allowed_types = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ]
    # content_type might be None for some clients
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            400,
            f"Unsupported file type: {file.content_type}. Supported: PDF, JPEG, PNG",
        )

    # Read file
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(400, "Uploaded file is empty")

    if len(file_bytes) > 30 * 1024 * 1024:  # 30 MB limit
        raise HTTPException(400, "File too large (max 30MB)")

    # Parse chat history
    messages: list[ChatMessage] = []
    if chat_history:
        try:
            raw_messages = json.loads(chat_history)
            messages = [ChatMessage(**m) for m in raw_messages]
        except (json.JSONDecodeError, Exception) as e:
            logger.warning("Invalid chat_history JSON: %s", str(e))

    # Parse factory info
    factory: Optional[OEMFactoryInfo] = None
    if factory_info:
        try:
            factory = OEMFactoryInfo(**json.loads(factory_info))
        except (json.JSONDecodeError, Exception) as e:
            logger.warning("Invalid factory_info JSON: %s", str(e))

    # Run OCR
    ocr_service = OCRService()
    ocr_result = await ocr_service.extract(file_bytes, file.filename or "document.pdf")

    # Extract layout for click-to-highlight anchors (best effort)
    layout_result = await ocr_service.extract_layout(file_bytes, file.filename or "document.pdf")

    # Run risk analysis pipeline
    try:
        result = await run_risk_check_pipeline(
            ocr_result=ocr_result,
            ocr_layout=layout_result,
            chat_history=messages,
            factory_info=factory,
            language=language,
        )
    except Exception as e:
        logger.error("Risk analysis pipeline failed: %s", str(e))
        raise HTTPException(500, f"Risk analysis failed: {str(e)}")

    return result


@router.post("/ocr-only")
async def ocr_only(
    file: UploadFile = File(..., description="Document to OCR"),
):
    """
    Extract text from a document without running risk analysis.
    Useful for previewing OCR results before full analysis.
    """
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(400, "Uploaded file is empty")

    ocr_service = OCRService()
    result = await ocr_service.extract(file_bytes, file.filename or "document.pdf")

    return {
        "text": result.get("text", ""),
        "page_count": result.get("page_count", 0),
        "char_count": result.get("char_count", 0),
        "method": result.get("method", "unknown"),
    }


# ── Risk Explanation (AI deep-dive on a single risk) ─────────────────────────


class RiskExplainRequest(BaseModel):
    risk_id: str
    title_th: str = ""
    title_en: str = ""
    level: str = "medium"
    clause_ref: str = ""
    description_th: str = ""
    description_en: str = ""
    recommendation_th: str = ""
    recommendation_en: str = ""
    category: str = "general"


class ClientLogRequest(BaseModel):
    level: str = "info"
    event: str
    context: dict = Field(default_factory=dict)


class RiskExplainResponse(BaseModel):
    risk_id: str
    explanation_th: str
    explanation_en: str
    business_impact: list[str] = Field(default_factory=list)
    worst_case_scenario: str = ""
    compliance_notice: str = ""


@router.post("/client-log")
async def client_log(request: ClientLogRequest):
    """
    Receives frontend diagnostic events and writes them to backend logs.
    Useful for production debugging where browser console is not accessible.
    """
    level = (request.level or "info").lower()
    message = "ClientLog | event=%s | context=%s"
    args = (request.event, request.context)

    if level == "error":
        logger.error(message, *args)
    elif level == "warning" or level == "warn":
        logger.warning(message, *args)
    else:
        logger.info(message, *args)

    return {"status": "ok"}


@router.post("/explain", response_model=RiskExplainResponse)
async def explain_risk(request: RiskExplainRequest):
    """
    AI-powered deep explanation of a single risk item.
    Explains what the risk means, how it can harm the business,
    and gives a real-world scenario without legal recommendations.
    """
    try:
        logger.info("Risk explain requested | risk_id=%s | level=%s | category=%s", request.risk_id, request.level, request.category)

        response_text = await typhoon_invoke(
            system_prompt=RISK_EXPLAIN_SYSTEM,
            user_prompt=RISK_EXPLAIN_USER.format(
                title_th=request.title_th,
                title_en=request.title_en,
                level=request.level,
                clause_ref=request.clause_ref or "ไม่ระบุ",
                description_th=request.description_th,
                description_en=request.description_en,
                category=request.category,
            ),
            temperature=0.2,
        )

        # Try to parse JSON response
        import re
        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = {
                "explanation_th": response_text,
                "explanation_en": "",
                "business_impact": [],
                "worst_case_scenario": "",
                "compliance_notice": "ข้อมูลนี้เป็นคำอธิบายเชิงข้อมูลทั่วไป ไม่ใช่คำแนะนำทางกฎหมาย",
            }

        compliance_notice = data.get("compliance_notice") or "This explanation is informational only and not legal advice."

        return RiskExplainResponse(
            risk_id=request.risk_id,
            explanation_th=data.get("explanation_th", ""),
            explanation_en=data.get("explanation_en", ""),
            business_impact=data.get("business_impact", []),
            worst_case_scenario=data.get("worst_case_scenario", ""),
            compliance_notice=compliance_notice,
        )
    except Exception as e:
        logger.error("Risk explanation failed: %s", str(e))
        raise HTTPException(500, f"Risk explanation failed: {str(e)}")
