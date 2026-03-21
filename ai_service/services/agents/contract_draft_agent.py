"""
Contract Draft Agent - LangChain-powered contract generation pipeline.

Steps (matching UI prototype):
  Step 1/4: Extract context from chat -> auto-fill Deal Sheet
  Step 2+3/4: Generate articles from template + Deal Sheet, then optionally polish language
  Step 4/4: Finalize & generate PDF/DOCX
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import time
import uuid
from collections import OrderedDict
from datetime import datetime
from typing import Any, Optional

from config import settings
from models.contract_draft import (
    ChatMessage,
    CommercialTerms,
    ContractArticle,
    DealSheet,
    ExtractContextRequest,
    ExtractContextResponse,
    FinalizeRequest,
    FinalizeResponse,
    GenerateDraftRequest,
    GenerateDraftResponse,
    PartyInfo,
    PaymentMilestone,
    ProductInfo,
    QualityTerms,
    RegulatoryTerms,
    TemplateType,
)
from services.document.storage_paths import get_contracts_dir
from services.drafting.retrieval import retrieve_drafting_context
from services.llm.gemini_client import gemini_invoke
from services.llm.prompts import (
    ARTICLE_GENERATION_SYSTEM,
    ARTICLE_GENERATION_USER,
    CONTEXT_EXTRACTION_SYSTEM,
    CONTEXT_EXTRACTION_USER,
    LINGUISTIC_POLISH_SYSTEM,
    LINGUISTIC_POLISH_USER,
    TEMPLATE_ARTICLE_GENERATION_SYSTEM,
    TEMPLATE_ARTICLE_GENERATION_USER,
)
from services.supabase_client import (
    check_storage_bucket_access,
    ensure_storage_config,
    is_production_runtime,
    upload_contract_file,
)
from services.templates.template_loader import (
    build_article_skeleton,
    build_fairness_checklist,
    fill_preamble,
    load_legal_refs,
    load_template,
)

logger = logging.getLogger(__name__)

_EXTRACT_CONTEXT_CACHE: "OrderedDict[str, ExtractContextResponse]" = OrderedDict()
_EXTRACT_CONTEXT_CACHE_MAX = 48


async def extract_context(request: ExtractContextRequest) -> ExtractContextResponse:
    """
    Extract deal information from chat history and produce an auto-filled Deal Sheet.
    This is Step 1/4 in the UI prototype.
    """

    clean_chat_history = _sanitize_chat_messages(request.chat_history)
    cache_key = _build_extract_context_cache_key(
        clean_chat_history,
        request.factory_id,
        request.factory_name,
    )
    cached = _EXTRACT_CONTEXT_CACHE.get(cache_key)
    if cached and not request.force_refresh:
        _EXTRACT_CONTEXT_CACHE.move_to_end(cache_key)
        logger.info("Step 1: Reusing cached context extraction for %s", request.factory_id or "unknown")
        return cached

    logger.info("Step 1: Extracting context from %d chat messages", len(clean_chat_history))
    deterministic_deal_sheet = _enrich_deal_sheet_from_chat(
        clean_chat_history,
        DealSheet(confidence=72),
        request.factory_name,
    )
    deterministic_template = _suggest_template_from_deal_sheet(deterministic_deal_sheet)
    if _has_strong_deterministic_context(deterministic_deal_sheet):
        response = ExtractContextResponse(
            deal_sheet=deterministic_deal_sheet,
            suggested_template=deterministic_template,
            auto_filled_fields=_derive_auto_filled_fields(deterministic_deal_sheet),
        )
        _remember_extract_context(cache_key, response)
        logger.info("Step 1: Returning deterministic context extraction for %s", request.factory_id or "unknown")
        return response

    chat_text = "\n".join(
        f"[{message.sender}] {message.message}"
        for message in clean_chat_history
        if message.message.strip()
    )
    if not chat_text:
        chat_text = "(ไม่มีข้อความในแชท)"

    try:
        response_text = await gemini_invoke(
            system_prompt=CONTEXT_EXTRACTION_SYSTEM,
            user_prompt=CONTEXT_EXTRACTION_USER.replace("{chat_history}", chat_text)
            .replace("{factory_name}", request.factory_name or "ไม่ทราบ")
            .replace("{factory_id}", request.factory_id or "N/A"),
            temperature=0.1,
        )
    except Exception as error:
        logger.warning("Context extraction model call failed, using deterministic extraction: %s", str(error))
        response = ExtractContextResponse(
            deal_sheet=deterministic_deal_sheet,
            suggested_template=deterministic_template,
            auto_filled_fields=_derive_auto_filled_fields(deterministic_deal_sheet),
        )
        _remember_extract_context(cache_key, response)
        return response

    try:
        data = _parse_json_response(response_text)
    except Exception:
        logger.warning("Failed to parse context extraction JSON, using deterministic extraction")
        response = ExtractContextResponse(
            deal_sheet=deterministic_deal_sheet,
            suggested_template=deterministic_template,
            auto_filled_fields=_derive_auto_filled_fields(deterministic_deal_sheet),
        )
        _remember_extract_context(cache_key, response)
        return response

    deal_sheet = _build_deal_sheet(data)
    deal_sheet = _enrich_deal_sheet_from_chat(clean_chat_history, deal_sheet, request.factory_name)
    template_str = str(data.get("suggested_template") or TemplateType.SALES_CONTRACT.value)
    try:
        suggested_template = TemplateType(template_str)
    except ValueError:
        suggested_template = TemplateType.SALES_CONTRACT

    auto_filled_fields = _normalize_auto_filled_fields(
        data.get("auto_filled_fields"),
        deal_sheet,
    )
    response = ExtractContextResponse(
        deal_sheet=deal_sheet,
        suggested_template=suggested_template,
        auto_filled_fields=auto_filled_fields,
    )
    _remember_extract_context(cache_key, response)
    return response


async def generate_draft(request: GenerateDraftRequest) -> GenerateDraftResponse:
    """
    Generate contract articles from the template type and deal sheet.
    Steps 2+3/4 in the UI prototype.

    1. Variable injection: fill template with deal sheet values
    2. Article generation: model generates formal Thai articles
    3. Linguistic polish: optional second pass for demo/export quality
    """

    started_at = time.perf_counter()
    logger.info("Step 2+3: Generating draft for template %s", request.template_type.value)

    deal_sheet_json = json.dumps(
        request.deal_sheet.model_dump() if request.deal_sheet else {},
        ensure_ascii=False,
        indent=2,
    )
    parties_json = json.dumps(
        [party.model_dump() for party in request.parties],
        ensure_ascii=False,
        indent=2,
    )
    product_json = json.dumps(
        request.product.model_dump() if request.product else {},
        ensure_ascii=False,
        indent=2,
    )

    retrieval_context = retrieve_drafting_context(
        request.template_type.value,
        request.deal_sheet,
        request.parties,
        request.product,
    )
    retrieved_sections = retrieval_context.as_prompt_sections()

    template = None
    use_template = False
    response_text = ""

    try:
        template = load_template(request.template_type.value)
        if template:
            logger.info("Using template-first approach for %s", request.template_type.value)
            preamble_filled = fill_preamble(
                template,
                [party.model_dump() for party in request.parties],
                request.deal_sheet.delivery_date if request.deal_sheet else None,
            )
            article_skeleton = build_article_skeleton(template)
            fairness_checklist = build_fairness_checklist(template)
            legacy_legal_refs = load_legal_refs(request.template_type.value)

            user_prompt = TEMPLATE_ARTICLE_GENERATION_USER
            substitutions = {
                "{template_name}": template.get("template_name_th") or request.template_type.value,
                "{legal_basis}": template.get("legal_basis") or "",
                "{article_skeleton}": article_skeleton or "",
                "{fairness_checklist}": fairness_checklist or "",
                "{preamble}": preamble_filled or "",
                "{retrieved_legal_authorities}": retrieved_sections["legal_authorities"],
                "{retrieved_clause_patterns}": retrieved_sections["clause_patterns"],
                "{retrieved_approved_examples}": retrieved_sections["approved_exemplars"],
                "{legacy_legal_refs}": legacy_legal_refs or "",
                "{deal_sheet}": deal_sheet_json,
                "{parties}": parties_json,
                "{product}": product_json,
            }
            for key, value in substitutions.items():
                user_prompt = user_prompt.replace(key, str(value))

            response_text = await gemini_invoke(
                system_prompt=TEMPLATE_ARTICLE_GENERATION_SYSTEM,
                user_prompt=user_prompt,
                temperature=0.15,
            )
            use_template = True
    except Exception as error:
        logger.warning("Template-first failed, falling back to generic prompt: %s", str(error))
        template = None
        use_template = False

    if not use_template:
        logger.info("Using generic prompt for %s", request.template_type.value)
        user_prompt = ARTICLE_GENERATION_USER
        substitutions = {
            "{template_type}": request.template_type.value,
            "{retrieved_legal_authorities}": retrieved_sections["legal_authorities"],
            "{retrieved_clause_patterns}": retrieved_sections["clause_patterns"],
            "{retrieved_approved_examples}": retrieved_sections["approved_exemplars"],
            "{deal_sheet}": deal_sheet_json,
            "{parties}": parties_json,
            "{product}": product_json,
        }
        for key, value in substitutions.items():
            user_prompt = user_prompt.replace(key, str(value))

        response_text = await gemini_invoke(
            system_prompt=ARTICLE_GENERATION_SYSTEM,
            user_prompt=user_prompt,
            temperature=0.15,
        )

    try:
        data = _parse_json_response(response_text)
    except Exception:
        logger.error("Failed to parse article generation JSON")
        return GenerateDraftResponse(
            contract_title="Draft Contract",
            contract_filename="Contract_Draft_v1",
            articles=[
                ContractArticle(
                    article_number=1,
                    title_th="ข้อผิดพลาด",
                    title_en="Error",
                    body_th="ไม่สามารถสร้างสัญญาได้ กรุณาลองอีกครั้ง",
                    body_en="Could not generate contract. Please try again.",
                )
            ],
            polish_applied=False,
        )

    articles = [
        ContractArticle(
            article_number=article.get("article_number", index + 1),
            title_th=article.get("title_th", f"ข้อ {index + 1}"),
            title_en=article.get("title_en", f"Article {index + 1}"),
            body_th=article.get("body_th", ""),
            body_en=article.get("body_en", ""),
        )
        for index, article in enumerate(data.get("articles", []))
    ]

    if request.skip_polish:
        final_articles = articles
        polish_applied = False
    else:
        final_articles = await _polish_articles(articles)
        polish_applied = True

    effective_date = data.get("effective_date") or _current_thai_legal_date()
    final_preamble_th = data.get("preamble_th", "")
    if template and not final_preamble_th:
        final_preamble_th = fill_preamble(
            template,
            [party.model_dump() for party in request.parties],
            effective_date,
        )
    final_preamble_th = _ensure_preamble_has_effective_date(final_preamble_th, effective_date)

    logger.info(
        "Draft generation completed in %.2fs (polish_applied=%s)",
        time.perf_counter() - started_at,
        polish_applied,
    )
    return GenerateDraftResponse(
        contract_title=data.get("contract_title", "สัญญา"),
        contract_filename=data.get("contract_filename", "Contract_Draft_v1"),
        articles=final_articles,
        effective_date=effective_date,
        preamble_th=final_preamble_th,
        preamble_en=data.get("preamble_en", ""),
        retrieval_debug=retrieval_context.as_debug_payload(),
        polish_applied=polish_applied,
    )


async def _polish_articles(articles: list[ContractArticle]) -> list[ContractArticle]:
    """
    Run each article through the model for formal Thai linguistic polish.
    Uses asyncio.gather to polish articles concurrently.
    """

    async def _polish_one(article: ContractArticle) -> ContractArticle:
        if len(article.body_th) < 20:
            return article

        try:
            user_prompt = LINGUISTIC_POLISH_USER.replace(
                "{article_title}",
                article.title_th,
            ).replace(
                "{article_body}",
                article.body_th,
            )
            response = await gemini_invoke(
                system_prompt=LINGUISTIC_POLISH_SYSTEM,
                user_prompt=user_prompt,
                temperature=0.05,
            )
            data = _parse_json_response(response)
            return ContractArticle(
                article_number=article.article_number,
                title_th=data.get("title_th", article.title_th),
                title_en=article.title_en,
                body_th=data.get("body_th", article.body_th),
                body_en=article.body_en,
                is_editable=article.is_editable,
            )
        except Exception as error:
            logger.warning("Polish failed for article %d: %s", article.article_number, str(error))
            return article

    polished = await asyncio.gather(*[_polish_one(article) for article in articles])
    return list(polished)


async def finalize_contract(request: FinalizeRequest) -> FinalizeResponse:
    """
    Finalize the contract - generate PDF and/or DOCX, save to history.
    Step 4/4 in the UI prototype.
    """

    logger.info("Step 4: Finalizing contract '%s'", request.contract_title)
    finalize_started_at = time.perf_counter()

    production_storage_required = is_production_runtime()
    if production_storage_required:
        try:
            ensure_storage_config()
            check_storage_bucket_access(settings.supabase_storage_bucket)
        except Exception as error:
            logger.error("Supabase Storage not configured for production finalize: %s", str(error))
            raise RuntimeError(str(error)) from error

    contract_id = f"CTR-{uuid.uuid4().hex[:8].upper()}"
    pdf_url: Optional[str] = None
    docx_url: Optional[str] = None
    generation_errors: list[str] = []

    articles_for_export = request.articles
    if request.polish_before_export:
        articles_for_export = await _polish_articles(request.articles)

    if request.output_format in ("pdf", "both"):
        try:
            pdf_started_at = time.perf_counter()
            from services.document.pdf_generator import generate_contract_pdf

            pdf_bytes = generate_contract_pdf(
                title=request.contract_title,
                preamble=request.preamble_th,
                articles=articles_for_export,
                parties=request.parties,
                effective_date=request.effective_date,
            )
            logger.info("PDF generated via fpdf2 in %.2fs", time.perf_counter() - pdf_started_at)

            pdf_path = f"contracts/{contract_id}.pdf"
            if production_storage_required or (settings.supabase_url and settings.supabase_key):
                pdf_url = upload_contract_file(
                    pdf_path,
                    pdf_bytes,
                    bucket=settings.supabase_storage_bucket,
                )
                logger.info("Uploaded PDF to Supabase: %s", pdf_url)
            else:
                local_path = str(get_contracts_dir() / f"{contract_id}.pdf")
                _save_file(local_path, pdf_bytes)
                pdf_url = f"/api/ai/contract-draft/contracts/{contract_id}/download/pdf"
        except Exception as error:
            logger.error("PDF generation failed: %s", str(error))
            generation_errors.append(f"pdf: {error}")

    if request.output_format in ("docx", "both"):
        try:
            docx_started_at = time.perf_counter()
            from services.document.docx_generator import generate_contract_docx

            docx_bytes = generate_contract_docx(
                title=request.contract_title,
                preamble=request.preamble_th,
                articles=articles_for_export,
                parties=request.parties,
                effective_date=request.effective_date,
            )
            logger.info("DOCX generation completed in %.2fs", time.perf_counter() - docx_started_at)

            docx_path = f"contracts/{contract_id}.docx"
            if production_storage_required or (settings.supabase_url and settings.supabase_key):
                docx_url = upload_contract_file(
                    docx_path,
                    docx_bytes,
                    bucket=settings.supabase_storage_bucket,
                )
                logger.info("Uploaded DOCX to Supabase: %s", docx_url)
            else:
                local_path = str(get_contracts_dir() / f"{contract_id}.docx")
                _save_file(local_path, docx_bytes)
                docx_url = f"/api/ai/contract-draft/contracts/{contract_id}/download/docx"
        except Exception as error:
            logger.error("DOCX generation failed: %s", str(error))
            generation_errors.append(f"docx: {error}")

    if not pdf_url and not docx_url:
        raise RuntimeError("; ".join(generation_errors) or "No output file could be generated")

    if request.deal_sheet:
        history_bytes = json.dumps(
            request.deal_sheet.model_dump(),
            ensure_ascii=False,
            indent=2,
        ).encode("utf-8")
        if production_storage_required or (settings.supabase_url and settings.supabase_key):
            history_path = f"contracts/{contract_id}_deal_sheet.json"
            upload_contract_file(
                history_path,
                history_bytes,
                bucket=settings.supabase_storage_bucket,
            )
        else:
            history_path = str(get_contracts_dir() / f"{contract_id}_deal_sheet.json")
            _save_file(history_path, history_bytes)

    logger.info("Finalize contract completed in %.2fs", time.perf_counter() - finalize_started_at)
    return FinalizeResponse(
        pdf_url=pdf_url,
        docx_url=docx_url,
        contract_id=contract_id,
        message_th="สัญญาแบบร่างของคุณพร้อมแล้ว บันทึกไปยังประวัติสัญญาและ Deal Room แล้ว",
        message_en="Your draft contract is ready. Saved to Contract History and Deal Room.",
        saved_to_history=True,
    )


def _build_extract_context_cache_key(
    chat_history: list[ChatMessage],
    factory_id: Optional[str],
    factory_name: Optional[str],
) -> str:
    payload = {
        "factory_id": factory_id or "",
        "factory_name": factory_name or "",
        "messages": [message.model_dump() for message in chat_history],
    }
    return hashlib.sha256(
        json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()


def _remember_extract_context(cache_key: str, response: ExtractContextResponse) -> None:
    _EXTRACT_CONTEXT_CACHE[cache_key] = response
    _EXTRACT_CONTEXT_CACHE.move_to_end(cache_key)
    while len(_EXTRACT_CONTEXT_CACHE) > _EXTRACT_CONTEXT_CACHE_MAX:
        _EXTRACT_CONTEXT_CACHE.popitem(last=False)


def _build_deal_sheet(data: dict[str, Any]) -> DealSheet:
    vendor = _model_from_payload(PartyInfo, data.get("vendor"))
    client = _model_from_payload(PartyInfo, data.get("client"))
    product = _model_from_payload(ProductInfo, data.get("product"))
    commercial_terms = _model_from_payload(CommercialTerms, data.get("commercial_terms"))
    quality_terms = _model_from_payload(QualityTerms, data.get("quality_terms"))
    regulatory_terms = _model_from_payload(RegulatoryTerms, data.get("regulatory_terms"))
    payment_milestones = _list_of_models(PaymentMilestone, data.get("payment_milestones"))

    return DealSheet(
        vendor=vendor,
        client=client,
        product=product,
        total_price=data.get("total_price"),
        currency=data.get("currency", "THB"),
        delivery_date=data.get("delivery_date"),
        delivery_weeks=data.get("delivery_weeks"),
        delivery_address=data.get("delivery_address"),
        payment_milestones=payment_milestones,
        quality_terms=quality_terms,
        regulatory_terms=regulatory_terms,
        commercial_terms=commercial_terms,
        additional_notes=data.get("additional_notes"),
        confidence=data.get("confidence", 0),
    )


def _enrich_deal_sheet_from_chat(
    chat_history: list[ChatMessage],
    deal_sheet: DealSheet,
    factory_name: str | None = None,
) -> DealSheet:
    user_messages = [message.message.strip() for message in chat_history if (message.sender or "").lower() == "user"]
    factory_messages = [message.message.strip() for message in chat_history if (message.sender or "").lower() == "factory"]

    if not deal_sheet.client:
        deal_sheet.client = PartyInfo(role="buyer")
    if not deal_sheet.vendor:
        deal_sheet.vendor = PartyInfo(role="seller", name=factory_name or "")
    if not deal_sheet.product:
        deal_sheet.product = ProductInfo()
    if not deal_sheet.quality_terms:
        deal_sheet.quality_terms = QualityTerms()
    if not deal_sheet.regulatory_terms:
        deal_sheet.regulatory_terms = RegulatoryTerms()
    if not deal_sheet.commercial_terms:
        deal_sheet.commercial_terms = CommercialTerms()

    user_text = "\n".join(user_messages)
    factory_text = "\n".join(factory_messages)
    combined_text = "\n".join(message.message.strip() for message in chat_history if message.message.strip())

    _apply_party_details(deal_sheet.client, user_text, is_buyer=True)
    _apply_party_details(deal_sheet.vendor, factory_text, is_buyer=False)

    if not deal_sheet.product.specs:
        product_sentences = []
        for pattern in (
            r"(The product should be .*?)(?:\. Formula ownership|$)",
            r"(We want .*?)(?:\. Formula ownership|$)",
        ):
            match = re.search(pattern, user_text, re.IGNORECASE | re.DOTALL)
            if match:
                product_sentences.append(_clean_sentence(match.group(1)))
        if product_sentences:
            deal_sheet.product.specs = ". ".join(dict.fromkeys(product_sentences))

    if not deal_sheet.product.packaging:
        packaging_match = re.search(
            r"(airless pump bottle.*?secondary box|packaging appearance|matte pastel peach secondary box)",
            user_text,
            re.IGNORECASE | re.DOTALL,
        )
        if packaging_match:
            deal_sheet.product.packaging = _clean_sentence(packaging_match.group(1))

    if not deal_sheet.delivery_address:
        delivery_match = re.search(
            r"Delivery should go to (.*?)(?:\.| We also need|$)",
            user_text,
            re.IGNORECASE | re.DOTALL,
        )
        if delivery_match:
            deal_sheet.delivery_address = _clean_sentence(delivery_match.group(1))

    if not deal_sheet.payment_milestones:
        deal_sheet.payment_milestones = _extract_payment_milestones(user_text)

    if not deal_sheet.total_price:
        total_match = re.search(r"THB\s*([0-9,]+)", combined_text, re.IGNORECASE)
        if total_match:
            deal_sheet.total_price = float(total_match.group(1).replace(",", ""))

    if not deal_sheet.delivery_weeks:
        weeks_match = re.search(r"(\d+\s*(?:to|-)\s*\d+\s*days)", combined_text, re.IGNORECASE)
        if weeks_match:
            deal_sheet.delivery_weeks = _clean_sentence(weeks_match.group(1))

    if not deal_sheet.quality_terms.qc_basis:
        qc_match = re.search(
            r"For QC we can align to (.*?)(?:\. If bulk goods fail|$)",
            factory_text,
            re.IGNORECASE | re.DOTALL,
        )
        if qc_match:
            deal_sheet.quality_terms.qc_basis = _clean_sentence(qc_match.group(1))

    if not deal_sheet.quality_terms.defect_remedy:
        remedy_match = re.search(
            r"If bulk goods fail .*?, we can (.*?)(?:\.|$)",
            factory_text,
            re.IGNORECASE | re.DOTALL,
        )
        if remedy_match:
            deal_sheet.quality_terms.defect_remedy = _clean_sentence(remedy_match.group(1))

    if not deal_sheet.regulatory_terms.registration_owner and re.search(r"FDA notification responsibility can be assigned to your brand|buyer handles FDA filing", combined_text, re.IGNORECASE):
        deal_sheet.regulatory_terms.registration_owner = "buyer"
    if not deal_sheet.regulatory_terms.document_support_by and re.search(r"providing the manufacturing documents and technical support|factory supports documents|support dossier preparation|technical documents", combined_text, re.IGNORECASE):
        deal_sheet.regulatory_terms.document_support_by = "seller"
    if not deal_sheet.regulatory_terms.label_compliance_owner:
        if re.search(r"artwork compliance review", user_text, re.IGNORECASE):
            deal_sheet.regulatory_terms.label_compliance_owner = "buyer"
        elif re.search(r"artwork compliance comments", factory_text, re.IGNORECASE):
            deal_sheet.regulatory_terms.label_compliance_owner = "shared"

    if not deal_sheet.commercial_terms.payment_terms_summary and deal_sheet.payment_milestones:
        deal_sheet.commercial_terms.payment_terms_summary = " / ".join(
            filter(
                None,
                [
                    f"{int(m.amount_percentage)}% {m.due_event}".strip()
                    if m.amount_percentage is not None else ""
                    for m in deal_sheet.payment_milestones
                ],
            )
        )

    return deal_sheet


def _apply_party_details(party: PartyInfo, text: str, *, is_buyer: bool) -> None:
    if is_buyer:
        intro_match = re.search(
            r"this is\s+(?P<name>[^.,]+)\s+from\s+(?P<company>.*?)(?:\.|\s+We are based at)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        address_match = re.search(
            r"We are based at\s+(?P<address>.*?)(?:\s+and our tax ID is|\.)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        tax_match = re.search(r"tax ID is\s*(?P<tax>\d{10,15})", text, re.IGNORECASE)
    else:
        intro_match = re.search(
            r"this is\s+(?P<name>[^.,]+)\s+from\s+(?P<company>[^,]+)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        address_match = re.search(
            r"from\s+[^,]+,\s+(?P<address>.*?)(?:\.|\s+Our manufacturing tax ID)",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        tax_match = re.search(r"tax ID .*?(\d{10,15})", text, re.IGNORECASE)

    if intro_match:
        if not party.name:
            party.name = _clean_sentence(intro_match.group("name"))
        if not party.company:
            party.company = _clean_sentence(intro_match.group("company"))
        if not party.address:
            address = intro_match.groupdict().get("address")
            if address:
                party.address = _clean_sentence(address)
    if address_match and not party.address:
        party.address = _clean_sentence(address_match.group("address"))
    if tax_match and not party.tax_id:
        party.tax_id = tax_match.group(1)


def _extract_payment_milestones(text: str) -> list[PaymentMilestone]:
    payment_match = re.search(
        r"(\d+)%\s+deposit,\s*(\d+)%\s+after sample approval,\s*and\s*(\d+)%\s+before final shipment",
        text,
        re.IGNORECASE,
    )
    if not payment_match:
        return []
    first, second, third = payment_match.groups()
    return [
        PaymentMilestone(label="deposit", amount_percentage=float(first), due_event="deposit"),
        PaymentMilestone(label="sample approval", amount_percentage=float(second), due_event="after sample approval"),
        PaymentMilestone(label="final shipment", amount_percentage=float(third), due_event="before final shipment"),
    ]


def _clean_sentence(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" .,\n\t")


def _current_thai_legal_date() -> str:
    months = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ]
    now = datetime.now()
    return f"{now.day} {months[now.month - 1]} {now.year + 543}"


def _ensure_preamble_has_effective_date(preamble: str, effective_date: str) -> str:
    normalized = (preamble or "").strip()
    if not normalized:
        return f"สัญญาฉบับนี้ทำขึ้น เมื่อวันที่ {effective_date}"
    if "สัญญาฉบับนี้ทำขึ้น" in normalized and effective_date in normalized:
        return normalized
    if normalized.startswith("สัญญาฉบับนี้ทำขึ้น"):
        return re.sub(
            r"^สัญญาฉบับนี้ทำขึ้น.*?(?=ระหว่าง|โดย|ทั้งสองฝ่าย|$)",
            f"สัญญาฉบับนี้ทำขึ้น เมื่อวันที่ {effective_date} ",
            normalized,
            count=1,
        ).strip()
    return f"สัญญาฉบับนี้ทำขึ้น เมื่อวันที่ {effective_date} {normalized}".strip()


def _has_strong_deterministic_context(deal_sheet: DealSheet) -> bool:
    score = 0
    if deal_sheet.client:
        if deal_sheet.client.name:
            score += 2
        if deal_sheet.client.company:
            score += 2
        if deal_sheet.client.address:
            score += 2
        if deal_sheet.client.tax_id:
            score += 2
    if deal_sheet.vendor:
        if deal_sheet.vendor.name:
            score += 2
        if deal_sheet.vendor.company:
            score += 2
        if deal_sheet.vendor.address:
            score += 2
        if deal_sheet.vendor.tax_id:
            score += 2
    if deal_sheet.product:
        if deal_sheet.product.name:
            score += 2
        if deal_sheet.product.specs:
            score += 2
        if deal_sheet.product.packaging:
            score += 2
        if deal_sheet.product.target_market:
            score += 1
        if deal_sheet.product.quantity is not None:
            score += 1
    if deal_sheet.total_price is not None:
        score += 2
    if deal_sheet.delivery_address:
        score += 2
    if deal_sheet.payment_milestones:
        score += 2
    if deal_sheet.quality_terms and deal_sheet.quality_terms.qc_basis:
        score += 1
    if deal_sheet.regulatory_terms and deal_sheet.regulatory_terms.registration_owner:
        score += 1
    return score >= 14


def _suggest_template_from_deal_sheet(deal_sheet: DealSheet) -> TemplateType:
    product_name = (deal_sheet.product.name if deal_sheet.product else "") or ""
    product_specs = (deal_sheet.product.specs if deal_sheet.product else "") or ""
    combined = " ".join(
        filter(
            None,
            [
                product_name.lower(),
                product_specs.lower(),
                deal_sheet.delivery_address.lower() if deal_sheet.delivery_address else "",
                deal_sheet.commercial_terms.payment_terms_summary.lower()
                if deal_sheet.commercial_terms and deal_sheet.commercial_terms.payment_terms_summary
                else "",
            ],
        )
    )
    if any(keyword in combined for keyword in ("oem", "manufact", "formula", "sample", "qc", "golden sample")):
        return TemplateType.HIRE_OF_WORK
    if deal_sheet.product and deal_sheet.product.name:
        return TemplateType.HIRE_OF_WORK
    return TemplateType.SALES_CONTRACT


def _model_from_payload(model_cls, payload):
    if not isinstance(payload, dict):
        return None
    return model_cls(**payload)


def _list_of_models(model_cls, payload: Any) -> list:
    if not isinstance(payload, list):
        return []
    items = []
    for item in payload:
        if isinstance(item, dict):
            items.append(model_cls(**item))
    return items


def _normalize_auto_filled_fields(
    raw_fields: Any,
    deal_sheet: DealSheet,
) -> list[str]:
    if isinstance(raw_fields, list):
        normalized = [str(item).strip() for item in raw_fields if str(item).strip()]
        if normalized:
            return sorted(set(normalized))
    return _derive_auto_filled_fields(deal_sheet)


def _derive_auto_filled_fields(deal_sheet: DealSheet) -> list[str]:
    fields: list[str] = []
    if deal_sheet.vendor:
        if deal_sheet.vendor.name:
            fields.append("vendor.name")
        if deal_sheet.vendor.company:
            fields.append("vendor.company")
        if deal_sheet.vendor.address:
            fields.append("vendor.address")
        if deal_sheet.vendor.tax_id:
            fields.append("vendor.tax_id")
    if deal_sheet.client:
        if deal_sheet.client.name:
            fields.append("client.name")
        if deal_sheet.client.company:
            fields.append("client.company")
        if deal_sheet.client.address:
            fields.append("client.address")
        if deal_sheet.client.tax_id:
            fields.append("client.tax_id")
    if deal_sheet.product:
        if deal_sheet.product.name:
            fields.append("product.name")
        if deal_sheet.product.specs:
            fields.append("product.specs")
        if deal_sheet.product.quantity is not None:
            fields.append("product.quantity")
        if deal_sheet.product.unit:
            fields.append("product.unit")
        if deal_sheet.product.packaging:
            fields.append("product.packaging")
        if deal_sheet.product.target_market:
            fields.append("product.target_market")
    if deal_sheet.total_price is not None:
        fields.append("total_price")
    if deal_sheet.delivery_date:
        fields.append("delivery_date")
    if deal_sheet.delivery_weeks:
        fields.append("delivery_weeks")
    if deal_sheet.delivery_address:
        fields.append("delivery_address")
    if deal_sheet.payment_milestones:
        fields.append("payment_milestones")
    if deal_sheet.quality_terms:
        if deal_sheet.quality_terms.standards:
            fields.append("quality_terms.standards")
        if deal_sheet.quality_terms.qc_basis:
            fields.append("quality_terms.qc_basis")
        if deal_sheet.quality_terms.acceptance_window_days is not None:
            fields.append("quality_terms.acceptance_window_days")
        if deal_sheet.quality_terms.defect_remedy:
            fields.append("quality_terms.defect_remedy")
        if deal_sheet.quality_terms.warranty_period_days is not None:
            fields.append("quality_terms.warranty_period_days")
    if deal_sheet.regulatory_terms:
        if deal_sheet.regulatory_terms.registration_owner:
            fields.append("regulatory_terms.registration_owner")
        if deal_sheet.regulatory_terms.document_support_by:
            fields.append("regulatory_terms.document_support_by")
        if deal_sheet.regulatory_terms.label_compliance_owner:
            fields.append("regulatory_terms.label_compliance_owner")
        if deal_sheet.regulatory_terms.target_market:
            fields.append("regulatory_terms.target_market")
    if deal_sheet.commercial_terms:
        if deal_sheet.commercial_terms.ip_ownership:
            fields.append("commercial_terms.ip_ownership")
        if deal_sheet.commercial_terms.ip_details:
            fields.append("commercial_terms.ip_details")
        if deal_sheet.commercial_terms.penalty_type:
            fields.append("commercial_terms.penalty_type")
        if deal_sheet.commercial_terms.penalty_details:
            fields.append("commercial_terms.penalty_details")
        if deal_sheet.commercial_terms.payment_terms_summary:
            fields.append("commercial_terms.payment_terms_summary")
        if deal_sheet.commercial_terms.artwork_ownership:
            fields.append("commercial_terms.artwork_ownership")
        if deal_sheet.commercial_terms.tooling_ownership:
            fields.append("commercial_terms.tooling_ownership")
        if deal_sheet.commercial_terms.tooling_return_required is not None:
            fields.append("commercial_terms.tooling_return_required")
        if deal_sheet.commercial_terms.lead_time_days is not None:
            fields.append("commercial_terms.lead_time_days")
        if deal_sheet.commercial_terms.termination_trigger:
            fields.append("commercial_terms.termination_trigger")
    if deal_sheet.additional_notes:
        fields.append("additional_notes")
    return sorted(set(fields))


def _parse_json_response(text: str) -> dict:
    """Extract JSON from an LLM response that may contain markdown fences or extra text."""

    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    if "```" in text:
        import re

        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass

    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace:last_brace + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from LLM response ({len(text)} chars)")


def _sanitize_chat_messages(
    chat_history: list[ChatMessage],
    *,
    max_messages: int = 10,
    max_chars: int = 2200,
) -> list[ChatMessage]:
    priority_terms = (
        "buyer", "seller", "vendor", "factory", "manufacturer", "company", "address", "tax", "vat",
        "product", "formula", "ingredient", "packaging", "spec", "size", "label",
        "price", "cost", "quote", "budget", "total", "deposit", "payment", "milestone", "%",
        "moq", "qty", "quantity", "pieces", "pcs", "kg", "batch",
        "delivery", "lead time", "shipment", "ship", "weeks", "days", "deadline",
        "qc", "quality", "inspection", "standard", "gmp", "iso", "sample", "approve",
        "fda", "registration", "regulatory", "อย.",
        "ip", "intellectual property", "artwork", "tooling", "penalty", "terminate",
        "ผู้ซื้อ", "ผู้ขาย", "โรงงาน", "บริษัท", "ที่อยู่", "ภาษี", "สินค้า", "สูตร", "บรรจุภัณฑ์",
        "ราคา", "มัดจำ", "ชำระ", "งวด", "จำนวน", "ขั้นต่ำ", "ส่งมอบ", "คุณภาพ", "มาตรฐาน",
        "อย", "ทรัพย์สินทางปัญญา", "ค่าปรับ", "ยกเลิก",
    )
    anchor_patterns = (
        "this is ",
        "we are based at ",
        "tax id",
        "delivery should go to ",
        "the product should be ",
    )

    def _score_message(message: ChatMessage) -> int:
        text = (message.message or "").strip().lower()
        if not text:
            return -1
        score = 0
        for term in priority_terms:
            if term in text:
                score += 3
        if any(char.isdigit() for char in text):
            score += 2
        if len(text) > 40:
            score += 1
        if (message.sender or "").lower() == "factory":
            score += 1
        return score

    cleaned: list[ChatMessage] = []
    for message in chat_history:
        text = (message.message or "").strip()
        if not text:
            continue
        if (message.sender or "").lower() == "system":
            continue
        if text.lower().startswith("uploaded:"):
            continue
        cleaned.append(message)

    scored = [
        (index, message, _score_message(message))
        for index, message in enumerate(cleaned)
    ]
    anchor_indexes: set[int] = set()
    first_user_index = next((index for index, message in enumerate(cleaned) if (message.sender or "").lower() == "user"), None)
    first_factory_index = next((index for index, message in enumerate(cleaned) if (message.sender or "").lower() == "factory"), None)
    if first_user_index is not None:
        anchor_indexes.add(first_user_index)
    if first_factory_index is not None:
        anchor_indexes.add(first_factory_index)

    for index, message, score in scored:
        text = (message.message or "").strip().lower()
        if score >= 0 and any(pattern in text for pattern in anchor_patterns):
            anchor_indexes.add(index)

    anchored = [
        item for item in scored
        if item[0] in anchor_indexes and item[2] >= 0
    ]
    remaining_slots = max(max_messages - len(anchored), 0)
    prioritized = [
        message
        for _, message, _ in sorted(
            [item for item in scored if item[2] >= 0 and item[0] not in anchor_indexes],
            key=lambda item: (item[2], item[0]),
            reverse=True,
        )[:remaining_slots]
    ] + [message for _, message, _ in sorted(anchored, key=lambda item: item[0])]
    prioritized_set = {id(message) for message in prioritized}
    cleaned = [
        message
        for message in cleaned
        if id(message) in prioritized_set
    ]
    bounded: list[ChatMessage] = []
    total_chars = 0
    for message in reversed(cleaned):
        text_len = len(message.message)
        if bounded and total_chars + text_len > max_chars:
            break
        bounded.append(message)
        total_chars += text_len

    return list(reversed(bounded))


def _save_file(path: str, content: bytes) -> None:
    """Save bytes to a local file, creating directories as needed."""

    import os

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as file:
        file.write(content)
