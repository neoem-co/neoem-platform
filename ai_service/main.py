"""
NeoEM AI Service — FastAPI application entry point.

Provides two core AI services:
  1. Contract Risk Check Agent — OCR → legal compliance → risk analysis
  2. AI Contract Drafting Agent — chat context → template → formal Thai contract

Run:
  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import risk_check, contract_draft

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NeoEM AI Service",
    description=(
        "AI-powered backend for the NeoEM OEM e-commerce platform.\n\n"
        "**Service 1** — Contract Risk Check: Upload a contract PDF → OCR → "
        "legal compliance (RAG + Thanoy) → risk analysis\n\n"
        "**Service 2** — AI Contract Draft: Extract deal context from chat → "
        "generate formal Thai contract → PDF/DOCX download"
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow Next.js frontend) ───────────────────────────────────────────
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(risk_check.router)
app.include_router(contract_draft.router)


# ── Startup events ──────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("NeoEM AI Service starting (env=%s)", settings.app_env)

    # Create data directories
    os.makedirs("./data/contracts", exist_ok=True)
    os.makedirs("./data/chroma_db", exist_ok=True)

    # Seed the legal knowledge vector store
    try:
        from services.rag.vector_store import seed_thai_legal_knowledge
        seed_thai_legal_knowledge()
    except Exception as e:
        logger.warning("Vector store seeding skipped: %s", str(e))


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "NeoEM AI Service",
        "version": "0.1.0",
        "environment": settings.app_env,
    }


@app.get("/")
async def root():
    return {
        "service": "NeoEM AI Service",
        "docs": "/docs",
        "endpoints": {
            "risk_check": "/api/risk-check/analyze",
            "contract_draft_templates": "/api/contract-draft/templates",
            "contract_draft_extract": "/api/contract-draft/extract-context",
            "contract_draft_generate": "/api/contract-draft/generate",
            "contract_draft_finalize": "/api/contract-draft/finalize",
        },
    }
