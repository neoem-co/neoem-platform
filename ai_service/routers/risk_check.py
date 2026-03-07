"""
API router for the Contract Risk Check service.
"""

from __future__ import annotations

import json
import logging
import time

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from typing import Optional

from models.risk_check import (
    ChatMessage,
    OEMFactoryInfo,
    RiskCheckRequest,
    RiskCheckResponse,
)
from services.ocr.iapp_ocr import OCRService
from services.agents.risk_check_agent import run_risk_check_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/risk-check", tags=["Risk Check"])


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

    # Run risk analysis pipeline
    result = await run_risk_check_pipeline(
        ocr_result=ocr_result,
        chat_history=messages,
        factory_info=factory,
        language=language,
    )

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
