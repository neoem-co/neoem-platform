"""
Pydantic models for the Contract Risk Check service.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ───────────────────────────────────────────────────────────────────


class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SAFE = "safe"


class ContractType(str, Enum):
    SALES = "sales_contract"
    HIRE_OF_WORK = "hire_of_work"
    NDA = "nda"
    DISTRIBUTION = "distribution"
    HYBRID_OEM = "hybrid_oem"
    UNKNOWN = "unknown"


# ─── Request Models ──────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    """A single message from the deal room chat."""
    sender: str = Field(description="'user' | 'factory' | 'system'")
    message: str
    timestamp: str


class OEMFactoryInfo(BaseModel):
    """Basic factory profile used as context for risk analysis."""
    factory_id: str
    name: str
    location: Optional[str] = None
    category: Optional[str] = None
    certifications: list[str] = Field(default_factory=list)
    rating: Optional[float] = None
    verified: bool = False


class RiskCheckRequest(BaseModel):
    """
    Payload sent by the frontend to trigger a full risk analysis.
    The file itself is uploaded as multipart/form-data alongside this JSON.
    """
    chat_history: list[ChatMessage] = Field(
        default_factory=list,
        description="Deal room chat messages for context comparison.",
    )
    factory_info: Optional[OEMFactoryInfo] = None
    language: str = Field(
        default="th",
        description="Primary output language: 'th' | 'en' | 'both'",
    )


# ─── Internal / Pipeline Models ──────────────────────────────────────────────


class ExtractedClause(BaseModel):
    """A single clause parsed from the contract document."""
    clause_id: str
    title: str
    body: str
    page: Optional[int] = None


class StructuredContract(BaseModel):
    """Document text structured into machine-readable form."""
    raw_text: str
    contract_type: ContractType = ContractType.UNKNOWN
    parties: list[str] = Field(default_factory=list)
    effective_date: Optional[str] = None
    clauses: list[ExtractedClause] = Field(default_factory=list)
    ocr_method: str = Field(
        default="pymupdf",
        description="'pymupdf' | 'iapp_ocr'",
    )
    ocr_confidence: Optional[float] = None


class DealContext(BaseModel):
    """Aggregated context from chat + factory info."""
    chat_summary: str = ""
    agreed_product: Optional[str] = None
    agreed_price: Optional[float] = None
    agreed_quantity: Optional[str] = None
    agreed_delivery: Optional[str] = None
    factory_name: Optional[str] = None
    factory_certifications: list[str] = Field(default_factory=list)


class LegalReference(BaseModel):
    """A Thai legal article/section relevant to the contract."""
    law_name: str = Field(description="E.g. พ.ร.บ.แพ่งและพาณิชย์")
    section: str = Field(description="E.g. มาตรา 587")
    summary: str
    relevance: str


# ─── Response Models ─────────────────────────────────────────────────────────


class RiskItem(BaseModel):
    """A single risk finding."""
    risk_id: str
    clause_ref: Optional[str] = Field(
        default=None,
        description="Which contract clause this risk relates to.",
    )
    level: RiskLevel
    confidence: float = Field(ge=0, le=100, description="0-100 confidence score")
    title_th: str
    title_en: str
    description_th: str
    description_en: str
    recommendation_th: str
    recommendation_en: str
    legal_refs: list[LegalReference] = Field(default_factory=list)
    category: str = Field(
        default="general",
        description=(
            "Category: 'ip_ownership' | 'recipe_theft' | 'payment_terms' "
            "| 'termination' | 'penalty' | 'delivery' | 'quality' | 'general'"
        ),
    )


class ChatContractMismatch(BaseModel):
    """A discrepancy between what was agreed in chat vs. the contract."""
    field: str
    chat_value: str
    contract_value: str
    severity: RiskLevel


class RiskCheckResponse(BaseModel):
    """Final response returned to the frontend."""
    overall_risk: RiskLevel
    risk_score: float = Field(ge=0, le=100)
    risks: list[RiskItem] = Field(default_factory=list)
    mismatches: list[ChatContractMismatch] = Field(default_factory=list)
    legal_checklist: list[LegalReference] = Field(default_factory=list)
    summary_th: str = ""
    summary_en: str = ""
    contract_type: ContractType = ContractType.UNKNOWN
    structured_contract: Optional[StructuredContract] = None
    processing_time_seconds: float = 0.0
