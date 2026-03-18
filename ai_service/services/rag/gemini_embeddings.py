"""
Lightweight Gemini embeddings client using the official REST API.

This avoids the LangChain Google embedding wrapper's batch request format,
which can fail in production with BatchEmbedContentsRequest model errors.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx
from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__name__)


class GeminiRESTEmbeddings(Embeddings):
    """Embeddings adapter compatible with LangChain vector stores."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-embedding-001",
        timeout: float = 30.0,
        output_dimensionality: Optional[int] = None,
    ) -> None:
        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing")

        # The REST path expects the bare model id; we normalize either form....
        self.api_key = api_key
        self.model = model.removeprefix("models/")
        self.timeout = timeout
        self.output_dimensionality = output_dimensionality

    @property
    def _endpoint(self) -> str:
        return (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/{self.model}:embedContent"
        )

    def _embed(self, text: str, task_type: str) -> list[float]:
        payload: dict = {
            "content": {
                "parts": [{"text": text}],
            },
            "taskType": task_type,
        }
        if self.output_dimensionality:
            payload["outputDimensionality"] = self.output_dimensionality

        response = httpx.post(
            self._endpoint,
            params={"key": self.api_key},
            json=payload,
            timeout=self.timeout,
        )

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip()
            logger.error("Gemini embedding request failed: %s", detail)
            raise RuntimeError(f"Error embedding content: {detail}") from exc

        data = response.json()
        values = data.get("embedding", {}).get("values")
        if not values:
            raise RuntimeError(f"Gemini embedding response missing values: {data}")
        return values

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text, task_type="RETRIEVAL_DOCUMENT") for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text, task_type="RETRIEVAL_QUERY")
