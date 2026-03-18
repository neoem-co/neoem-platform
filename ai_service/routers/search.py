from __future__ import annotations

import json
import logging
import math
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Query
from langchain_core.documents import Document

from services.rag.vector_store import get_factory_store, factory_similarity_search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/search", tags=["search"])

FACTORIES_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "factories.json"

def seed_factories():
    """Seed the vector store with factory data for semantic search."""
    store = get_factory_store()
    
    # Check if already seeded. Chroma has .get(); PGVector does not.
    try:
        existing = store.similarity_search("โรงงาน", k=1)
        if existing:
            logger.info("Factory vector store already seeded, skipping.")
            return
    except Exception as e:
        logger.info("Factory store appears empty, proceeding with seed. (%s)", str(e))

    if not FACTORIES_DATA_PATH.exists():
        logger.warning("Factories data file not found at %s", FACTORIES_DATA_PATH)
        return

    with FACTORIES_DATA_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
        factories = data.get("factories", [])

    docs = []
    for f in factories:
        # Create a rich text description for embedding
        content = f"{f['name']}. {f['category']}. {f['description']}. "
        content += "Specialties: " + ", ".join(f['specialties']) + ". "
        content += "Certifications: " + ", ".join(f['certifications']) + ". "
        content += "Tags: " + ", ".join(f['tags']) + "."
        
        docs.append(Document(
            page_content=content,
            metadata={
                "id": f["id"],
                "name": f["name"],
                "category": f["category"],
                "rating": f["rating"],
                "reviewCount": f["reviewCount"],
                "verified": f["verified"]
            }
        ))

    store.add_documents(docs)
    logger.info("Seeded %d factories into vector store", len(docs))


@router.get("/semantic")
async def semantic_search(q: str = Query(..., min_length=1)):
    """
    Enhanced semantic search for factories with sentiment factor and newcomer boost.
    Returns recommended (top 1-3) and others.
    """
    # 1. Similarity Search
    results = await factory_similarity_search(q, k=10)
    
    # 2. Re-ranking with Sentiment and Newcomer Boost
    # Logic:
    # - Confidence Score (from vector search): 0 to 1
    # - Sentiment Factor: rating + log(reviewCount)
    # - Newcomer Boost: if reviewCount < 5, boost weight
    
    scored_factories = []
    for doc, score in results:
        meta = doc.metadata
        match_score = score # Chroma returning distance often, but LangChain relevance score maps to 0-1
        
        rating = float(meta.get("rating", 0))
        review_count = int(meta.get("reviewCount", 0))
        
        # Sentiment Factor: Normalized rating (0.1 to 1.0) * log boost for more reviews
        sentiment_factor = (rating / 5.0) * (1.0 + 0.1 * math.log1p(review_count))
        
        # Newcomer Boost
        newcomer_boost = 1.0
        if review_count < 10: # PRD says newcomer is verified OEM with no reviews yet
            newcomer_boost = 1.15
            
        final_score = match_score * sentiment_factor * newcomer_boost
        
        scored_factories.append({
            "id": meta["id"],
            "name": meta["name"],
            "match_score": match_score,
            "final_score": final_score,
            "is_recommended": final_score > 0.85 # Threshold from PRD
        })

    # Sort by final score
    scored_factories.sort(key=lambda x: x["final_score"], reverse=True)
    
    recommended = [f for f in scored_factories if f["is_recommended"]][:3]
    others = [f for f in scored_factories if f not in recommended]
    
    return {
        "query": q,
        "recommended": recommended,
        "others": others
    }

# Seed on module load for simplicity, or we can call it in startup
try:
    seed_factories()
except Exception as e:
    logger.error("Failed to seed factories: %s", str(e))
