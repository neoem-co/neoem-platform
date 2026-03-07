"""
Typhoon LLM client — OpenAI-compatible wrapper via LangChain.
Used for: chat summarisation, clause structuring, contract drafting, linguistic polish.
"""

from __future__ import annotations

import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from config import settings

logger = logging.getLogger(__name__)


def get_typhoon_llm(
    temperature: float = 0.1,
    max_tokens: int = 4096,
    model: Optional[str] = None,
) -> ChatOpenAI:
    """
    Create a LangChain ChatOpenAI instance pointing to Typhoon API.
    Typhoon exposes an OpenAI-compatible endpoint so we re-use ChatOpenAI.
    """
    return ChatOpenAI(
        model=model or settings.typhoon_model,
        openai_api_key=settings.typhoon_api_key,
        openai_api_base=settings.typhoon_base_url,
        temperature=temperature,
        max_tokens=max_tokens,
    )


async def typhoon_invoke(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
) -> str:
    """
    Quick helper — fire a single system+user message pair to Typhoon
    and return the assistant's text response.
    """
    llm = get_typhoon_llm(temperature=temperature, max_tokens=max_tokens)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    try:
        response = await llm.ainvoke(messages)
        return response.content
    except Exception as e:
        logger.error("Typhoon invocation failed: %s", str(e))
        raise
