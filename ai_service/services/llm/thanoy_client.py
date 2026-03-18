"""
iApp Thanoy Legal AI client.
Used for: Thai legal consultation, law reference lookup, legal risk reasoning.

API:
  POST https://api.iapp.co.th/v3/store/llm/thanoy-legal-ai
  Header: apikey
  Body:   { "query": "your Thai legal question" }
  Resp:   { "response": [{"text": "...", "type": "text"}], "token_size": {...}, ... }
"""

from __future__ import annotations

import logging

import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from config import settings

logger = logging.getLogger(__name__)


def _should_retry_thanoy_error(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError) and exc.response is not None:
        return exc.response.status_code >= 500
    return isinstance(exc, (httpx.TimeoutException, httpx.NetworkError, httpx.TransportError))


class ThanoyClient:
    """Client for iApp Thanoy Legal AI Chatbot."""

    def __init__(self) -> None:
        self._api_key = settings.iapp_thanoy_api_key or settings.iapp_api_key
        self._url = settings.iapp_thanoy_url

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=2, max=20),
        retry=retry_if_exception(_should_retry_thanoy_error),
    )
    async def consult(self, query: str) -> dict:
        """
        Send a Thai legal question to Thanoy and return the structured result.

        Returns:
            {
                "answer": str,          # Thanoy's full text response
                "token_size": {...},    # input/output/total
                "raw_response": [...],  # original response array
            }
        """
        logger.info("Thanoy query (first 80 chars): %s", query[:80])

        if not self._api_key:
            raise RuntimeError("Thanoy API key is missing. Set IAPP_THANOY_API_KEY or IAPP_API_KEY.")

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                self._url,
                headers={
                    "apikey": self._api_key,
                    "Content-Type": "application/json",
                },
                json={"query": query},
            )
            try:
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 401:
                    raise RuntimeError(
                        "Thanoy API unauthorized (401). Check IAPP_THANOY_API_KEY or IAPP_API_KEY in Vercel."
                    ) from exc
                raise
            data = resp.json()

        # Parse response
        response_items = data.get("response", [])
        full_text = "\n".join(
            item.get("text", "") for item in response_items if item.get("type") == "text"
        )

        return {
            "answer": full_text,
            "token_size": data.get("token_size", {}),
            "raw_response": response_items,
        }

    async def check_clause_legality(self, clause_text: str, contract_type: str = "OEM") -> dict:
        """
        Convenience method — ask Thanoy to assess a specific contract clause
        for legal compliance under Thai law.
        """
        query = (
            f"ในฐานะที่ปรึกษากฎหมาย กรุณาวิเคราะห์ข้อสัญญาต่อไปนี้จากสัญญา {contract_type} "
            f"ว่ามีความเสี่ยงทางกฎหมายหรือขัดต่อกฎหมายไทยหรือไม่:\n\n"
            f'"{clause_text}"\n\n'
            f"กรุณาระบุ:\n"
            f"1. มาตราที่เกี่ยวข้อง\n"
            f"2. ระดับความเสี่ยง (สูง/กลาง/ต่ำ)\n"
            f"3. คำแนะนำในการแก้ไข"
        )
        return await self.consult(query)

    async def get_relevant_laws(self, contract_type: str, topics: list[str]) -> dict:
        """
        Ask Thanoy to list relevant Thai laws for a given contract type and topics.
        """
        topics_str = ", ".join(topics)
        query = (
            f"สำหรับสัญญาประเภท {contract_type} ที่เกี่ยวข้องกับ {topics_str} "
            f"กรุณาระบุกฎหมายและมาตราที่เกี่ยวข้องทั้งหมดของไทย "
            f"รวมถึง พ.ร.บ.แพ่งและพาณิชย์, พ.ร.บ.คุ้มครองผู้บริโภค, "
            f"พ.ร.บ.ความลับทางการค้า, และกฎหมายทรัพย์สินทางปัญญา"
        )
        return await self.consult(query)
