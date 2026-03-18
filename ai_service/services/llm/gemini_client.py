"""
Gemini LLM client — wrapper via LangChain Google Generative AI.
Used for: chat summarisation, clause structuring, contract drafting, linguistic polish.
"""

from __future__ import annotations

import logging
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)

def get_gemini_llm(
    temperature: float = 0.1,
    model: Optional[str] = None,
):
    """Create a LangChain ChatGoogleGenerativeAI pointing to Gemini API."""
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=model or settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=temperature,
    )

async def gemini_invoke(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.1,
) -> str:
    """
    Fire a single system+user message pair to Gemini and return the text.
    """
    model_name = settings.gemini_model
    logger.info("Gemini Invocation: model=%s, temp=%.2f", model_name, temperature)
    
    if not settings.gemini_api_key:
        logger.error("GEMINI_API_KEY is not set in environment variables")
        raise ValueError("GEMINI_API_KEY is missing")

    from langchain_core.messages import HumanMessage, SystemMessage

    llm = get_gemini_llm(temperature=temperature)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    try:
        response = await llm.ainvoke(messages)
        
        # Log token usage if available
        usage = getattr(response, "usage_metadata", None)
        if usage:
            # usage_metadata can be a dict or a pydantic model depending on LC version
            if isinstance(usage, dict):
                p_tokens = usage.get("input_tokens", 0)
                c_tokens = usage.get("output_tokens", 0)
                t_tokens = usage.get("total_tokens", 0)
            else:
                p_tokens = getattr(usage, "input_tokens", 0)
                c_tokens = getattr(usage, "output_tokens", 0)
                t_tokens = getattr(usage, "total_tokens", 0)
                
            logger.info("Gemini Usage: Prompt=%d, Completion=%d, Total=%d", p_tokens, c_tokens, t_tokens)
            
        return response.content
    except Exception as e:
        logger.error("Gemini invocation failed (%s): %s", model_name, str(e))
        raise
