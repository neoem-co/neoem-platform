"""
Contract Draft Agent — LangChain-powered contract generation pipeline.

Steps (matching UI prototype):
  Step 1/4: Extract context from chat → auto-fill Deal Sheet
  Step 2+3/4: Generate articles from template + Deal Sheet, then polish language
  Step 4/4: Finalize & generate PDF/DOCX
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from typing import Optional

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
    IPOwnership,
    PartyInfo,
    ProductInfo,
    TemplateType,
)
from services.llm.typhoon_client import typhoon_invoke
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
from services.templates.template_loader import (
    load_template,
    fill_preamble,
    build_article_skeleton,
    build_fairness_checklist,
    load_legal_refs,
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 1: Context Extraction (chat → Deal Sheet)
# ═══════════════════════════════════════════════════════════════════════════════


async def extract_context(request: ExtractContextRequest) -> ExtractContextResponse:
    """
    Extract deal information from chat history and produce an auto-filled Deal Sheet.
    This is Step 1/4 in the UI prototype.
    """
    logger.info("Step 1: Extracting context from %d chat messages", len(request.chat_history))

    chat_text = "\n".join(
        f"[{m.sender}] {m.message}" for m in request.chat_history if m.message.strip()
    )

    if not chat_text:
        chat_text = "(ไม่มีข้อความในแชท)"

    response_text = await typhoon_invoke(
        system_prompt=CONTEXT_EXTRACTION_SYSTEM,
        user_prompt=CONTEXT_EXTRACTION_USER.format(
            chat_history=chat_text,
            factory_name=request.factory_name or "ไม่ทราบ",
            factory_id=request.factory_id or "N/A",
        ),
        temperature=0.1,
    )

    try:
        data = _parse_json_response(response_text)
    except Exception:
        logger.warning("Failed to parse context extraction JSON, returning empty deal sheet")
        return ExtractContextResponse(
            deal_sheet=DealSheet(confidence=0),
            suggested_template=TemplateType.SALES_CONTRACT,
            auto_filled_fields=[],
        )

    # Build DealSheet from extracted data
    vendor_data = data.get("vendor")
    client_data = data.get("client")
    product_data = data.get("product")
    commercial_data = data.get("commercial_terms")

    vendor = PartyInfo(**vendor_data) if vendor_data else None
    client = PartyInfo(**client_data) if client_data else None
    product = ProductInfo(**product_data) if product_data else None
    commercial = (
        CommercialTerms(**commercial_data) if commercial_data else None
    )

    deal_sheet = DealSheet(
        vendor=vendor,
        client=client,
        product=product,
        total_price=data.get("total_price"),
        currency=data.get("currency", "THB"),
        delivery_date=data.get("delivery_date"),
        delivery_weeks=data.get("delivery_weeks"),
        commercial_terms=commercial,
        additional_notes=data.get("additional_notes"),
        confidence=data.get("confidence", 0),
    )

    # Determine suggested template
    template_str = data.get("suggested_template", "sales_contract")
    try:
        suggested = TemplateType(template_str)
    except ValueError:
        suggested = TemplateType.SALES_CONTRACT

    return ExtractContextResponse(
        deal_sheet=deal_sheet,
        suggested_template=suggested,
        auto_filled_fields=data.get("auto_filled_fields", []),
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 2+3: Generate Draft (template + deal sheet → articles → polish)
# ═══════════════════════════════════════════════════════════════════════════════


async def generate_draft(request: GenerateDraftRequest) -> GenerateDraftResponse:
    """
    Generate contract articles from the template type and deal sheet.
    Steps 2+3/4 in the UI prototype.

    1. Variable injection: fill template with deal sheet values
    2. Article generation: Typhoon generates formal Thai articles
    3. Linguistic polish: second pass for ราชการ tone
    """
    logger.info("Step 2+3: Generating draft for template %s", request.template_type.value)

    deal_sheet_json = json.dumps(
        request.deal_sheet.model_dump() if request.deal_sheet else {},
        ensure_ascii=False,
        indent=2,
    )

    parties_json = json.dumps(
        [p.model_dump() for p in request.parties],
        ensure_ascii=False,
        indent=2,
    )

    product_json = json.dumps(
        request.product.model_dump() if request.product else {},
        ensure_ascii=False,
        indent=2,
    )

    # ── Step 2: Article generation (Template-First if template exists) ───
    template = None
    use_template = False
    try:
        template = load_template(request.template_type.value)
        if template:
            logger.info("Using template-first approach for %s", request.template_type.value)

            preamble_filled = fill_preamble(
                template,
                [p.model_dump() for p in request.parties],
                request.deal_sheet.delivery_date if request.deal_sheet else None,
            )
            article_skeleton = build_article_skeleton(template)
            fairness_checklist = build_fairness_checklist(template)
            legal_refs = load_legal_refs(request.template_type.value)

            # Safe string substitution (avoids crashes from {/} in legal_refs)
            user_prompt = TEMPLATE_ARTICLE_GENERATION_USER
            subs = {
                "{template_name}": template.get("template_name_th") or request.template_type.value,
                "{legal_basis}": template.get("legal_basis") or "",
                "{article_skeleton}": article_skeleton or "",
                "{fairness_checklist}": fairness_checklist or "",
                "{preamble}": preamble_filled or "",
                "{deal_sheet}": deal_sheet_json,
                "{parties}": parties_json,
                "{product}": product_json,
                "{legal_refs}": legal_refs or "",
            }
            for key, val in subs.items():
                user_prompt = user_prompt.replace(key, str(val))

            response_text = await typhoon_invoke(
                system_prompt=TEMPLATE_ARTICLE_GENERATION_SYSTEM,
                user_prompt=user_prompt,
                temperature=0.15,
            )
            use_template = True
    except Exception as e:
        logger.warning("Template-first failed, falling back to generic prompt: %s", str(e))
        template = None
        use_template = False

    if not use_template:
        # Fallback: original prompt without template
        logger.info("Using generic prompt for %s", request.template_type.value)
        response_text = await typhoon_invoke(
            system_prompt=ARTICLE_GENERATION_SYSTEM,
            user_prompt=ARTICLE_GENERATION_USER.format(
                template_type=request.template_type.value,
                deal_sheet=deal_sheet_json,
                parties=parties_json,
                product=product_json,
            ),
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
        )

    articles = [
        ContractArticle(
            article_number=a.get("article_number", i + 1),
            title_th=a.get("title_th", f"ข้อ {i + 1}"),
            title_en=a.get("title_en", f"Article {i + 1}"),
            body_th=a.get("body_th", ""),
            body_en=a.get("body_en", ""),
        )
        for i, a in enumerate(data.get("articles", []))
    ]

    # ── Step 3: Linguistic polish (ราชการ tone) ──────────────────────────
    polished_articles = await _polish_articles(articles)

    # Use template preamble if available and LLM didn't provide one
    final_preamble_th = data.get("preamble_th", "")
    if template and not final_preamble_th:
        final_preamble_th = fill_preamble(
            template,
            [p.model_dump() for p in request.parties],
            request.deal_sheet.delivery_date if request.deal_sheet else None,
        )

    return GenerateDraftResponse(
        contract_title=data.get("contract_title", "สัญญา"),
        contract_filename=data.get("contract_filename", "Contract_Draft_v1"),
        articles=polished_articles,
        effective_date=data.get("effective_date"),
        preamble_th=final_preamble_th,
        preamble_en=data.get("preamble_en", ""),
    )


async def _polish_articles(articles: list[ContractArticle]) -> list[ContractArticle]:
    """
    Run each article through Typhoon for ราชการ linguistic polish.
    Uses asyncio.gather to polish articles concurrently (much faster).
    """

    async def _polish_one(article: ContractArticle) -> ContractArticle:
        if len(article.body_th) < 20:
            return article
        try:
            resp = await typhoon_invoke(
                system_prompt=LINGUISTIC_POLISH_SYSTEM,
                user_prompt=LINGUISTIC_POLISH_USER.format(
                    article_title=article.title_th,
                    article_body=article.body_th,
                ),
                temperature=0.05,
            )
            data = _parse_json_response(resp)
            return ContractArticle(
                article_number=article.article_number,
                title_th=data.get("title_th", article.title_th),
                title_en=article.title_en,
                body_th=data.get("body_th", article.body_th),
                body_en=article.body_en,
                is_editable=article.is_editable,
            )
        except Exception as e:
            logger.warning("Polish failed for article %d: %s", article.article_number, str(e))
            return article

    # Run all polish calls concurrently — respects Typhoon rate limits via httpx
    polished = await asyncio.gather(*[_polish_one(a) for a in articles])
    return list(polished)


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 4: Finalize (generate documents + save)
# ═══════════════════════════════════════════════════════════════════════════════


async def finalize_contract(request: FinalizeRequest) -> FinalizeResponse:
    """
    Finalize the contract — generate PDF and/or DOCX, save to history.
    Step 4/4 in the UI prototype.
    """
    logger.info("Step 4: Finalizing contract '%s'", request.contract_title)

    contract_id = f"CTR-{uuid.uuid4().hex[:8].upper()}"

    pdf_url: Optional[str] = None
    docx_url: Optional[str] = None

    # Generate documents
    if request.output_format in ("pdf", "both"):
        from services.document.pdf_generator import generate_contract_pdf
        pdf_bytes = generate_contract_pdf(
            title=request.contract_title,
            preamble=request.preamble_th,
            articles=request.articles,
            parties=request.parties,
        )
        # In production: upload to Supabase Storage and get URL
        # For now: save locally
        pdf_path = f"./data/contracts/{contract_id}.pdf"
        _save_file(pdf_path, pdf_bytes)
        pdf_url = f"/api/contract-draft/contracts/{contract_id}/download/pdf"

    if request.output_format in ("docx", "both"):
        from services.document.docx_generator import generate_contract_docx
        docx_bytes = generate_contract_docx(
            title=request.contract_title,
            preamble=request.preamble_th,
            articles=request.articles,
            parties=request.parties,
        )
        docx_path = f"./data/contracts/{contract_id}.docx"
        _save_file(docx_path, docx_bytes)
        docx_url = f"/api/contract-draft/contracts/{contract_id}/download/docx"

    # Save deal sheet JSON for future risk check comparison (History Check)
    if request.deal_sheet:
        history_path = f"./data/contracts/{contract_id}_deal_sheet.json"
        _save_file(
            history_path,
            json.dumps(
                request.deal_sheet.model_dump(),
                ensure_ascii=False,
                indent=2,
            ).encode("utf-8"),
        )

    return FinalizeResponse(
        pdf_url=pdf_url,
        docx_url=docx_url,
        contract_id=contract_id,
        message_th="สัญญาแบบร่างของคุณพร้อมแล้ว บันทึกไปยังประวัติสัญญาและ Deal Room แล้ว",
        message_en="Your draft contract is ready. Saved to Contract History and Deal Room.",
        saved_to_history=True,
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════


def _parse_json_response(text: str) -> dict:
    """Extract JSON from an LLM response that may contain markdown fences or extra text."""
    text = text.strip()

    # Strategy 1: try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: strip markdown code fences
    if "```" in text:
        import re
        m = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1).strip())
            except json.JSONDecodeError:
                pass

    # Strategy 3: find the first { ... } block (greedy from first { to last })
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace:last_brace + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from LLM response ({len(text)} chars)")


def _save_file(path: str, content: bytes) -> None:
    """Save bytes to a local file, creating directories as needed."""
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(content)
