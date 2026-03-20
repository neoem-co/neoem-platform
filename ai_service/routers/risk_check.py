"""
API router for the Contract Risk Check service.
"""

from __future__ import annotations

import json
import logging
import time
import mimetypes
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional

from config import settings
from models.risk_check import (
    ChatMessage,
    OEMFactoryInfo,
    RiskCheckRequest,
    RiskCheckResponse,
    StoredRiskCheckResult,
)
from services.ocr.iapp_ocr import OCRService
from services.agents.risk_check_agent import run_risk_check_pipeline
from services.llm.typhoon_client import typhoon_invoke
from services.llm.prompts import RISK_EXPLAIN_SYSTEM, RISK_EXPLAIN_USER
from services.document.storage_paths import get_risk_results_dir
from services.supabase_client import (
    _normalize_public_url,
    download_storage_file,
    get_supabase,
    is_production_runtime,
    upload_contract_file,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai/risk-check", tags=["Risk Check"])


def _guess_content_type(filename: str, fallback: str = "application/octet-stream") -> str:
    guessed = mimetypes.guess_type(filename)[0]
    return guessed or fallback


def _sanitize_filename(filename: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("._")
    return safe or "document.pdf"


def _save_local_file(file_path: Path, file_bytes: bytes) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(file_bytes)


def _build_local_source_file_url(analysis_id: str) -> str:
    return f"/api/ai/risk-check/results/{analysis_id}/download/source"


def _persist_risk_result(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    result: RiskCheckResponse,
) -> StoredRiskCheckResult:
    analysis_id = f"RSK-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()
    safe_filename = _sanitize_filename(filename)
    extension = Path(safe_filename).suffix or (".pdf" if content_type == "application/pdf" else "")

    source_object_path = f"risk-results/{analysis_id}{extension}"
    metadata_object_path = f"risk-results/{analysis_id}_result.json"

    use_remote_storage = is_production_runtime() or bool(settings.supabase_url and settings.supabase_key)

    if use_remote_storage:
        source_file_url = upload_contract_file(
            source_object_path,
            file_bytes,
            bucket=settings.supabase_storage_bucket,
        )
    else:
        local_source_path = get_risk_results_dir() / f"{analysis_id}{extension}"
        _save_local_file(local_source_path, file_bytes)
        source_file_url = _build_local_source_file_url(analysis_id)

    stored = StoredRiskCheckResult(
        analysis_id=analysis_id,
        created_at=created_at,
        source_filename=safe_filename,
        source_content_type=content_type or _guess_content_type(safe_filename, "application/pdf"),
        source_file_url=source_file_url,
        result=result,
    )

    metadata_bytes = json.dumps(
        stored.model_dump(mode="json"),
        ensure_ascii=False,
        indent=2,
    ).encode("utf-8")

    if use_remote_storage:
        upload_contract_file(
            metadata_object_path,
            metadata_bytes,
            bucket=settings.supabase_storage_bucket,
        )
    else:
        local_metadata_path = get_risk_results_dir() / f"{analysis_id}_result.json"
        _save_local_file(local_metadata_path, metadata_bytes)

    return stored


def _load_latest_local_risk_result(*, require_pdf: bool = True) -> StoredRiskCheckResult:
    risk_results_dir = get_risk_results_dir()
    if not risk_results_dir.exists():
        raise FileNotFoundError("No stored risk results found")

    result_files = sorted(
        risk_results_dir.glob("*_result.json"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )

    for path in result_files:
        stored = StoredRiskCheckResult.model_validate_json(path.read_text(encoding="utf-8"))
        if require_pdf and stored.source_content_type != "application/pdf":
            continue
        return stored

    raise FileNotFoundError("No stored PDF risk results found")


def _load_latest_supabase_risk_result(*, require_pdf: bool = True) -> StoredRiskCheckResult:
    supabase = get_supabase()
    results = supabase.storage.from_(settings.supabase_storage_bucket).list(
        "risk-results",
        {"limit": 200, "sortBy": {"column": "created_at", "order": "desc"}},
    )

    for item in results or []:
        name = item.get("name", "")
        if not name.endswith("_result.json"):
            continue
        object_path = f"risk-results/{name}"
        metadata_bytes = download_storage_file(object_path, bucket=settings.supabase_storage_bucket)
        stored = StoredRiskCheckResult.model_validate_json(metadata_bytes.decode("utf-8"))
        if require_pdf and stored.source_content_type != "application/pdf":
            continue
        if not stored.source_file_url:
            base_id = name.replace("_result.json", "")
            source_candidates = supabase.storage.from_(settings.supabase_storage_bucket).list(
                "risk-results",
                {"search": base_id},
            )
            for candidate in source_candidates or []:
                candidate_name = candidate.get("name", "")
                if candidate_name.startswith(base_id) and not candidate_name.endswith("_result.json"):
                    stored.source_file_url = _normalize_public_url(
                        supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(f"risk-results/{candidate_name}")
                    )
                    break
        return stored

    raise FileNotFoundError("No stored PDF risk results found")


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

    try:
        _persist_risk_result(
            file_bytes=file_bytes,
            filename=file.filename or "document.pdf",
            content_type=file.content_type or _guess_content_type(file.filename or "document.pdf", "application/pdf"),
            result=result,
        )
    except Exception as e:
        logger.warning("Risk analysis result persistence failed: %s", str(e))

    return result


@router.get("/latest-result", response_model=StoredRiskCheckResult)
async def get_latest_risk_result():
    """Return the latest stored real risk-analysis result with its source PDF URL."""
    try:
        if is_production_runtime() or (settings.supabase_url and settings.supabase_key):
            return _load_latest_supabase_risk_result(require_pdf=True)
        return _load_latest_local_risk_result(require_pdf=True)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        logger.error("Latest risk result retrieval failed: %s", str(e))
        raise HTTPException(500, f"Latest risk result retrieval failed: {str(e)}")


@router.get("/results/{analysis_id}/download/source")
async def download_stored_risk_source(analysis_id: str):
    """Download the locally stored source document for a saved risk result."""
    risk_results_dir = get_risk_results_dir()
    matches = sorted(risk_results_dir.glob(f"{analysis_id}.*"))
    source_file = next((path for path in matches if not path.name.endswith("_result.json")), None)
    if not source_file or not source_file.exists():
        raise HTTPException(404, "Stored risk source file not found")

    media_type = _guess_content_type(source_file.name, "application/octet-stream")
    return FileResponse(
        str(source_file),
        media_type=media_type,
        filename=source_file.name,
    )


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
