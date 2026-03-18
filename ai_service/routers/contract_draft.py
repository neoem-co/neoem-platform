"""
API router for the AI Contract Drafting service.
Follows the 4-step UI prototype flow.
"""

from __future__ import annotations

import logging
import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from models.contract_draft import (
    ExtractContextRequest,
    ExtractContextResponse,
    FinalizeRequest,
    FinalizeResponse,
    GenerateDraftRequest,
    GenerateDraftResponse,
    TemplateType,
)
from services.agents.contract_draft_agent import (
    extract_context,
    finalize_contract,
    generate_draft,
)
from services.document.storage_paths import get_contracts_dir
from services.supabase_client import is_production_runtime, list_contract_history
from templates.contract_templates import get_template, list_templates

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai/contract-draft", tags=["Contract Draft"])


# ── Step 0: Get available templates ──────────────────────────────────────────


@router.get("/templates")
async def get_templates():
    """
    List all available contract templates.
    Step 1/4 in the UI — user selects a template type.
    """
    return {"templates": list_templates()}


@router.get("/templates/{template_type}")
async def get_template_detail(template_type: TemplateType):
    """Get full template structure including required articles."""
    return get_template(template_type)


# ── Step 1: Extract context from chat ────────────────────────────────────────


@router.post("/extract-context", response_model=ExtractContextResponse)
async def step1_extract_context(request: ExtractContextRequest):
    """
    Step 1/4 — Send chat history, get auto-filled Deal Sheet.
    Frontend shows pre-filled form fields from this response.
    """
    try:
        return await extract_context(request)
    except Exception as e:
        logger.error("Context extraction failed: %s", str(e))
        raise HTTPException(500, f"Context extraction failed: {str(e)}")


# ── Step 2+3: Generate draft ─────────────────────────────────────────────────


@router.post("/generate", response_model=GenerateDraftResponse)
async def step2_3_generate_draft(request: GenerateDraftRequest):
    """
    Step 2+3/4 — Take the (user-edited) deal sheet + template → generate articles.
    Includes linguistic polish for formal Thai (ราชการ).
    """
    try:
        return await generate_draft(request)
    except Exception as e:
        logger.error("Draft generation failed: %s", str(e))
        raise HTTPException(500, f"Draft generation failed: {str(e)}")


# ── Step 4: Finalize & download ──────────────────────────────────────────────


@router.post("/finalize", response_model=FinalizeResponse)
async def step4_finalize(request: FinalizeRequest):
    """
    Step 4/4 — Finalize the contract, generate PDF/DOCX, and save to history.
    Returns download URLs.
    """
    try:
        return await finalize_contract(request)
    except Exception as e:
        logger.error("Finalization failed: %s", str(e))
        raise HTTPException(500, f"Finalization failed: {str(e)}")


@router.get("/history")
async def get_contract_history():
    """List finalized contracts from Supabase Storage or local fallback."""
    try:
        if is_production_runtime():
            return {"contracts": list_contract_history()}

        contracts_dir = get_contracts_dir()
        if not contracts_dir.exists():
            return {"contracts": []}

        grouped: dict[str, dict] = {}
        for path in contracts_dir.iterdir():
            name = path.name
            if not name.startswith("CTR-"):
                continue

            contract_id = name.split(".")[0].replace("_deal_sheet", "")
            created_at = str(path.stat().st_mtime)
            existing = grouped.get(contract_id) or {
                "id": contract_id,
                "contract_id": contract_id,
                "base_name": contract_id,
                "created_at": created_at,
                "pdf_url": None,
                "docx_url": None,
                "has_deal_sheet": False,
            }

            if name.endswith(".pdf"):
                existing["pdf_url"] = f"/api/ai/contract-draft/contracts/{contract_id}/download/pdf"
            elif name.endswith(".docx"):
                existing["docx_url"] = f"/api/ai/contract-draft/contracts/{contract_id}/download/docx"
            elif name.endswith("_deal_sheet.json"):
                existing["has_deal_sheet"] = True

            grouped[contract_id] = existing

        return {"contracts": sorted(grouped.values(), key=lambda item: item["created_at"], reverse=True)}
    except Exception as e:
        logger.error("Contract history listing failed: %s", str(e))
        raise HTTPException(500, f"Contract history listing failed: {str(e)}")


# ── File download endpoints ──────────────────────────────────────────────────


@router.get("/contracts/{contract_id}/download/{format}")
@router.get("/ai/contract-draft/contracts/{contract_id}/download/{format}")
async def download_contract(contract_id: str, format: str):
    """Download a finalized contract file (pdf or docx)."""
    if format not in ("pdf", "docx"):
        raise HTTPException(400, "Format must be 'pdf' or 'docx'")

    file_path = str(get_contracts_dir() / f"{contract_id}.{format}")
    if not os.path.exists(file_path):
        raise HTTPException(404, "Contract file not found")

    media_type = (
        "application/pdf" if format == "pdf" else
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=f"Contract_{contract_id}.{format}",
    )
