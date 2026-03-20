"""
Pydantic models for the AI Contract Drafting service.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


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


def _normalize_blank_string(value):
    return "" if value is None else value


class ChatMessage(BaseModel):
    sender: str
    message: str
    timestamp: str


class PartyInfo(BaseModel):
    """Information about a contract party."""

    name: str = ""
    role: str = Field(default="", description="'buyer' | 'seller' | 'vendor' | 'client'")
    company: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None

    @field_validator("name", "role", "company", "address", "tax_id", mode="before")
    @classmethod
    def _normalize_empty_strings(cls, value):
        return _normalize_blank_string(value)


class ProductInfo(BaseModel):
    """Product details for the contract."""

    name: str = ""
    specs: Optional[str] = None
    quantity: Optional[float] = None
    unit: str = "pieces"
    packaging: Optional[str] = None
    target_market: Optional[str] = None

    @field_validator("name", "specs", "unit", "packaging", "target_market", mode="before")
    @classmethod
    def _normalize_strings(cls, value):
        return _normalize_blank_string(value)


class PaymentMilestone(BaseModel):
    """Structured payment milestone for OEM deals."""

    label: str = ""
    amount_percentage: Optional[float] = None
    amount_fixed: Optional[float] = None
    due_event: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("label", "due_event", "notes", mode="before")
    @classmethod
    def _normalize_strings(cls, value):
        return _normalize_blank_string(value)


class QualityTerms(BaseModel):
    """Structured quality / QC information."""

    standards: list[str] = Field(default_factory=list)
    qc_basis: Optional[str] = None
    acceptance_window_days: Optional[int] = None
    defect_remedy: Optional[str] = None
    warranty_period_days: Optional[int] = None

    @field_validator("qc_basis", "defect_remedy", mode="before")
    @classmethod
    def _normalize_strings(cls, value):
        return _normalize_blank_string(value)


class RegulatoryTerms(BaseModel):
    """Regulatory / FDA responsibility split."""

    registration_owner: Optional[str] = None
    document_support_by: Optional[str] = None
    label_compliance_owner: Optional[str] = None
    target_market: Optional[str] = None
    notes: Optional[str] = None

    @field_validator(
        "registration_owner",
        "document_support_by",
        "label_compliance_owner",
        "target_market",
        "notes",
        mode="before",
    )
    @classmethod
    def _normalize_strings(cls, value):
        return _normalize_blank_string(value)


class CommercialTerms(BaseModel):
    """Commercial terms section."""

    commercial_type: CommercialTerm = CommercialTerm.STANDARD
    ip_ownership: IPOwnership = IPOwnership.BUYER
    ip_details: Optional[str] = None
    penalty_type: PenaltyType = PenaltyType.NONE
    penalty_details: Optional[str] = None
    payment_terms_summary: Optional[str] = None
    artwork_ownership: Optional[str] = None
    tooling_ownership: Optional[str] = None
    tooling_return_required: Optional[bool] = None
    lead_time_days: Optional[int] = None
    termination_trigger: Optional[str] = None

    @field_validator(
        "ip_ownership",
        mode="before",
    )
    @classmethod
    def _normalize_ip(cls, value: str) -> str:
        aliases = {"seller": "factory", "joint": "shared", "manufacturer": "factory"}
        return aliases.get(value, value) if isinstance(value, str) else value

    @field_validator(
        "ip_details",
        "penalty_details",
        "payment_terms_summary",
        "artwork_ownership",
        "tooling_ownership",
        "termination_trigger",
        mode="before",
    )
    @classmethod
    def _normalize_strings(cls, value):
        return _normalize_blank_string(value)


class ExtractContextRequest(BaseModel):
    """Step 1 - send chat history, get auto-filled deal sheet."""

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
    delivery_address: Optional[str] = None
    payment_milestones: list[PaymentMilestone] = Field(default_factory=list)
    quality_terms: Optional[QualityTerms] = None
    regulatory_terms: Optional[RegulatoryTerms] = None
    commercial_terms: Optional[CommercialTerms] = None
    additional_notes: Optional[str] = None
    confidence: float = Field(
        default=0,
        ge=0,
        le=100,
        description="How confident the extraction is (0-100).",
    )

    @field_validator("currency", "delivery_date", "delivery_weeks", "delivery_address", "additional_notes", mode="before")
    @classmethod
    def _normalize_strings(cls, value):
        return _normalize_blank_string(value)


class ExtractContextResponse(BaseModel):
    """Response from Step 1."""

    deal_sheet: DealSheet
    suggested_template: TemplateType = TemplateType.SALES_CONTRACT
    auto_filled_fields: list[str] = Field(
        default_factory=list,
        description="List of field names that were auto-filled from chat.",
    )


class GenerateDraftRequest(BaseModel):
    """Step 2+3 - take the (possibly user-edited) deal sheet + template choice and generate articles."""

    template_type: TemplateType
    deal_sheet: DealSheet
    parties: list[PartyInfo] = Field(default_factory=list)
    product: Optional[ProductInfo] = None
    total_price: Optional[float] = None
    currency: str = "THB"
    delivery_date: Optional[str] = None
    commercial_terms: Optional[CommercialTerms] = None
    language: str = Field(default="th", description="'th' | 'en' | 'both'")
    skip_polish: bool = False


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
    retrieval_debug: dict[str, list[dict[str, str]]] = Field(default_factory=dict)
    polish_applied: bool = True


class FinalizeRequest(BaseModel):
    """Step 4 - finalize the contract with any user edits."""

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
    polish_before_export: bool = False


class FinalizeResponse(BaseModel):
    """Response from Step 4 - download links."""

    pdf_url: Optional[str] = None
    docx_url: Optional[str] = None
    contract_id: str
    message_th: str = "สัญญาแบบร่างของคุณพร้อมแล้ว"
    message_en: str = "Your draft contract is ready."
    saved_to_history: bool = True
