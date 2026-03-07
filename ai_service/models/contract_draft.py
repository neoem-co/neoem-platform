"""
Pydantic models for the AI Contract Drafting service.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ───────────────────────────────────────────────────────────────────


class TemplateType(str, Enum):
    SALES_CONTRACT = "sales_contract"
    HIRE_OF_WORK = "hire_of_work"
    NDA = "nda"
    DISTRIBUTION = "distribution"
    HYBRID_OEM = "hybrid_oem"


class IPOwnership(str, Enum):
    BUYER = "buyer"
    FACTORY = "factory"
    SHARED = "shared"
    CUSTOM = "custom"


class PenaltyType(str, Enum):
    NONE = "none"
    FIXED_DAILY = "fixed_daily"
    PERCENTAGE_DAILY = "percentage_daily"
    EMAIL_NOTICE = "email_notice"
    CUSTOM = "custom"


class CommercialTerm(str, Enum):
    STANDARD = "standard"
    EXCLUSIVE = "exclusive"
    NON_EXCLUSIVE = "non_exclusive"


# ─── Request Models ──────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    sender: str
    message: str
    timestamp: str


class PartyInfo(BaseModel):
    """Information about a contract party."""
    name: str
    role: str = Field(description="'buyer' | 'seller' | 'vendor' | 'client'")
    company: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None


class ProductInfo(BaseModel):
    """Product details for the contract."""
    name: str
    specs: Optional[str] = None
    quantity: Optional[int] = None
    unit: str = "pieces"


class CommercialTerms(BaseModel):
    """Commercial terms section."""
    commercial_type: CommercialTerm = CommercialTerm.STANDARD
    ip_ownership: IPOwnership = IPOwnership.BUYER
    ip_details: Optional[str] = None
    penalty_type: PenaltyType = PenaltyType.NONE
    penalty_details: Optional[str] = None


# — Step 1: Extract context from chat ————————————————————————————————————————


class ExtractContextRequest(BaseModel):
    """Step 1 — send chat history, get auto-filled deal sheet."""
    chat_history: list[ChatMessage]
    factory_id: Optional[str] = None
    factory_name: Optional[str] = None


class DealSheet(BaseModel):
    """Structured deal information extracted from chat context."""
    vendor: Optional[PartyInfo] = None
    client: Optional[PartyInfo] = None
    product: Optional[ProductInfo] = None
    total_price: Optional[float] = None
    currency: str = "THB"
    delivery_date: Optional[str] = None
    delivery_weeks: Optional[str] = None
    commercial_terms: Optional[CommercialTerms] = None
    additional_notes: Optional[str] = None
    confidence: float = Field(
        default=0,
        ge=0,
        le=100,
        description="How confident the extraction is (0-100).",
    )


class ExtractContextResponse(BaseModel):
    """Response from Step 1."""
    deal_sheet: DealSheet
    suggested_template: TemplateType = TemplateType.SALES_CONTRACT
    auto_filled_fields: list[str] = Field(
        default_factory=list,
        description="List of field names that were auto-filled from chat.",
    )


# — Step 2/3: Generate draft contract ————————————————————————————————————————


class GenerateDraftRequest(BaseModel):
    """Step 2+3 — take the (possibly user-edited) deal sheet + template choice and generate articles."""
    template_type: TemplateType
    deal_sheet: DealSheet
    parties: list[PartyInfo] = Field(default_factory=list)
    product: Optional[ProductInfo] = None
    total_price: Optional[float] = None
    currency: str = "THB"
    delivery_date: Optional[str] = None
    commercial_terms: Optional[CommercialTerms] = None
    language: str = Field(default="th", description="'th' | 'en' | 'both'")


class ContractArticle(BaseModel):
    """A single article in the generated contract."""
    article_number: int
    title_th: str
    title_en: str = ""
    body_th: str
    body_en: str = ""
    is_editable: bool = True


class GenerateDraftResponse(BaseModel):
    """Response from Step 2+3."""
    contract_title: str
    contract_filename: str
    articles: list[ContractArticle] = Field(default_factory=list)
    effective_date: Optional[str] = None
    preamble_th: str = ""
    preamble_en: str = ""


# — Step 4: Finalize & download ——————————————————————————————————————————————


class FinalizeRequest(BaseModel):
    """Step 4 — finalize the contract with any user edits."""
    contract_title: str
    articles: list[ContractArticle]
    preamble_th: str = ""
    effective_date: Optional[str] = None
    parties: list[PartyInfo] = Field(default_factory=list)
    deal_sheet: Optional[DealSheet] = None
    output_format: str = Field(
        default="both",
        description="'pdf' | 'docx' | 'both'",
    )


class FinalizeResponse(BaseModel):
    """Response from Step 4 — download links."""
    pdf_url: Optional[str] = None
    docx_url: Optional[str] = None
    contract_id: str
    message_th: str = "สัญญาแบบร่างของคุณพร้อมแล้ว"
    message_en: str = "Your draft contract is ready."
    saved_to_history: bool = True
