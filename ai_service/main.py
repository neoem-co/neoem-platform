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
from routers import risk_check, contract_draft, search

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
app.include_router(search.router)


# ── Startup events ──────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("NeoEM AI Service starting (env=%s)", settings.app_env)

    # Create data directories (careful on serverless)
    try:
        os.makedirs("./data/contracts", exist_ok=True)
        os.makedirs("./data/chroma_db", exist_ok=True)
    except Exception as e:
        logger.warning("Could not create local data directories (likely serverless): %s", str(e))

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


# ── Seeding Endpoint (for production/Vercel) ───────────────────────────
@app.get("/api/ai/seed-db")
async def seed_db(key: str = ""):
    """Explicitly trigger vector store seeding. Use a secret key in prod."""
    if settings.app_env == "production" and key != settings.gemini_api_key[:5]:
        return {"error": "Unauthorized"}
    
    try:
        from services.rag.vector_store import seed_thai_legal_knowledge
        seed_thai_legal_knowledge()
        return {"status": "success", "message": "Legal knowledge seeded"}
    except Exception as e:
        logger.error("Seeding failed: %s", str(e))
        return {"status": "error", "message": str(e)}


@app.get("/")
async def root():
    return {
        "service": "NeoEM AI Service",
        "docs": "/docs",
        "endpoints": {
            "risk_check": "/api/ai/risk-check/analyze",
            "contract_draft": "/api/ai/contract-draft/...",
            "health": "/api/ai/health",
            "seed": "/api/ai/seed-db"
        },
    }
