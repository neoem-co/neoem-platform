"""
Typhoon LLM client — OpenAI-compatible wrapper via LangChain.
Used for: chat summarisation, clause structuring, contract drafting, linguistic polish.

Typhoon API quirks (discovered empirically):
  - max_tokens means TOTAL tokens (prompt + completion), not just completion.
  - The actual context window for typhoon-v2.5-30b-a3b-instruct is ~40 000 tokens.
  - If max_tokens is omitted LangChain sends None → Typhoon defaults to 512 server-side.
  - Two distinct 400 error patterns:
      a) "max_tokens must be at least prompt_tokens + 1" → prompt bigger than max_tokens
      b) "max_tokens is too large … maximum context length is N" → max_tokens > context window
"""

import logging
import re
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)

# Typhoon model context window (total tokens). Conservative value for
# typhoon-v2.5-30b-a3b-instruct (empirically shown to be 40 000).
_CONTEXT_WINDOW = 40_000
# Reserve some tokens for the completion so the model can actually respond.
_MIN_COMPLETION_BUDGET = 1024
# Default max_tokens — conservative completion budget.
# Contracts rarely exceed 4-8K tokens. Setting this too high
# causes 400 errors on some providers if total context exceeds limits.
_DEFAULT_MAX_TOKENS = 8192


def get_typhoon_llm(
    temperature: float = 0.1,
    max_tokens: int = _DEFAULT_MAX_TOKENS,
    model: Optional[str] = None,
):
    """Create a LangChain ChatOpenAI pointing to Typhoon API."""
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=model or settings.typhoon_model,
        openai_api_key=settings.typhoon_api_key,
        openai_api_base=settings.typhoon_base_url,
        temperature=temperature,
        max_tokens=max_tokens,
    )


def _parse_token_limit_error(error_str: str) -> Optional[int]:
    """
    Extract a usable max_tokens from a Typhoon 400 error message.

    Pattern A – prompt too big for current max_tokens:
      "max_tokens must be at least prompt_tokens + 1.0 (prompt_tokens: 9731, required: 9732, provided: 6000)"
      → returns required value (e.g. 9732) so we can set max_tokens high enough.

    Pattern B – max_tokens exceeds context window:
      "max_tokens is too large: 32768. This model's maximum context length is 40000 tokens
       and your request has 7680 input tokens"
      → returns (context_length - input_tokens - 1) so completion fits.
    """
    # Pattern A
    m = re.search(r"required:\s*(\d+)", error_str)
    if m:
        # Set max_tokens to required + generous completion buffer
        required = int(m.group(1))
        return min(required + 8192, _CONTEXT_WINDOW)

    # Pattern B
    m = re.search(r"maximum context length is (\d+) tokens.*?(\d+) input tokens", error_str)
    if m:
        ctx = int(m.group(1))
        inp = int(m.group(2))
        return ctx - inp - 1  # tight fit, model decides how much to generate

    return None


async def typhoon_invoke(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.1,
    max_tokens: int = _DEFAULT_MAX_TOKENS,
) -> str:
    """
    Fire a single system+user message pair to Typhoon and return the text.

    Automatically retries once with an adjusted max_tokens if the API
    returns a 400 related to token limits.
    """
    from langchain_core.messages import HumanMessage, SystemMessage
    
    llm = get_typhoon_llm(temperature=temperature, max_tokens=max_tokens)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    try:
        response = await llm.ainvoke(messages)
        return response.content
    except Exception as e:
        error_str = str(e)
        # Check for either of the two known Typhoon token-limit errors
        if "max_tokens" in error_str and ("must be at least" in error_str or "too large" in error_str):
            new_max = _parse_token_limit_error(error_str)
            if new_max and new_max > 0 and new_max != max_tokens:
                logger.warning(
                    "Typhoon token-limit error (max_tokens=%d), retrying with %d: %s",
                    max_tokens, new_max, error_str[:200],
                )
                llm2 = get_typhoon_llm(temperature=temperature, max_tokens=new_max)
                response = await llm2.ainvoke(messages)
                return response.content
        logger.error("Typhoon invocation failed: %s", error_str)
        raise
