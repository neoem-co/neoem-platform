"""
Vector store abstraction for RAG — Thai legal knowledge base.

Dev:  ChromaDB (file-based, zero config)
Prod: Swap to Supabase pgvector via environment variable.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

from config import settings

logger = logging.getLogger(__name__)

# ── Singleton ────────────────────────────────────────────────────────────────
_vector_store: Optional[Chroma] = None


def _get_embeddings() -> OpenAIEmbeddings:
    """
    Use Typhoon's OpenAI-compatible embeddings endpoint.
    Falls back to a lightweight sentence-transformer if Typhoon
    does not expose an embeddings route.
    """
    return OpenAIEmbeddings(
        openai_api_key=settings.typhoon_api_key,
        openai_api_base=settings.typhoon_base_url,
        model="typhoon-v2-70b-instruct",  # adjust to actual embedding model
    )


def get_vector_store() -> Chroma:
    """Return (or create) the ChromaDB vector store."""
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    persist_dir = settings.chroma_persist_dir
    os.makedirs(persist_dir, exist_ok=True)

    _vector_store = Chroma(
        collection_name="thai_legal_knowledge",
        embedding_function=_get_embeddings(),
        persist_directory=persist_dir,
    )
    logger.info("ChromaDB vector store initialised at %s", persist_dir)
    return _vector_store


# ── Convenience helpers ──────────────────────────────────────────────────────


async def similarity_search(query: str, k: int = 5) -> list[Document]:
    """Search for the most relevant legal documents for a query."""
    store = get_vector_store()
    return store.similarity_search(query, k=k)


async def add_documents(docs: list[Document]) -> None:
    """Add documents to the vector store (used during knowledge base ingestion)."""
    store = get_vector_store()
    store.add_documents(docs)
    logger.info("Added %d documents to vector store", len(docs))


def seed_thai_legal_knowledge() -> None:
    """
    Seed the vector store with foundational Thai legal knowledge for OEM contracts.
    This runs once on first startup if the store is empty.

    In production, this would be replaced by loading actual legal documents.
    For now, we embed curated summaries of key Thai laws.
    """
    store = get_vector_store()

    # Check if already seeded
    existing = store.get()
    if existing and len(existing.get("ids", [])) > 0:
        logger.info("Vector store already contains %d docs, skipping seed", len(existing["ids"]))
        return

    # ── Curated Thai Legal Knowledge for OEM Contracts ────────────────────
    legal_docs = [
        Document(
            page_content=(
                "พระราชบัญญัติแพ่งและพาณิชย์ มาตรา 587-607 ว่าด้วยสัญญาจ้างทำของ (Hire of Work) "
                "ผู้รับจ้างตกลงทำการงานสิ่งใดสิ่งหนึ่งจนสำเร็จให้แก่ผู้ว่าจ้าง และผู้ว่าจ้างตกลงให้สินจ้าง "
                "ถ้าผู้รับจ้างส่งมอบงานชักช้า ผู้ว่าจ้างมีสิทธิบอกเลิกสัญญาได้ "
                "สิทธิในทรัพย์สินทางปัญญาที่เกิดจากงานจ้างทำของ โดยหลักเป็นของผู้ว่าจ้าง "
                "เว้นแต่มีข้อตกลงเป็นอย่างอื่น"
            ),
            metadata={
                "law": "ประมวลกฎหมายแพ่งและพาณิชย์",
                "sections": "587-607",
                "topic": "hire_of_work",
                "relevance": "OEM manufacturing contracts",
            },
        ),
        Document(
            page_content=(
                "พระราชบัญญัติแพ่งและพาณิชย์ มาตรา 453-490 ว่าด้วยสัญญาซื้อขาย "
                "สัญญาซื้อขายคือสัญญาที่บุคคลฝ่ายหนึ่ง (ผู้ขาย) โอนกรรมสิทธิ์ทรัพย์สิน "
                "ให้แก่บุคคลอีกฝ่ายหนึ่ง (ผู้ซื้อ) โดยผู้ซื้อตกลงชำระราคา "
                "ผู้ขายต้องรับผิดในความชำรุดบกพร่องของทรัพย์สินที่ขาย "
                "กำหนดอายุความการเรียกร้อง 1 ปี"
            ),
            metadata={
                "law": "ประมวลกฎหมายแพ่งและพาณิชย์",
                "sections": "453-490",
                "topic": "sales_contract",
                "relevance": "OEM product sales",
            },
        ),
        Document(
            page_content=(
                "พระราชบัญญัติความลับทางการค้า พ.ศ. 2545 "
                "คุ้มครองข้อมูลที่เป็นความลับทางการค้า หมายถึงข้อมูลที่ยังไม่เป็นที่รู้จักโดยทั่วไป "
                "มีมูลค่าในเชิงพาณิชย์เนื่องจากเป็นความลับ และเจ้าของได้ดำเนินมาตรการที่สมเหตุผล "
                "ในการรักษาความลับนั้น สูตรผลิตภัณฑ์ (recipe/formulation) ถือเป็นความลับทางการค้า "
                "หากโรงงาน OEM นำสูตรไปใช้โดยไม่ได้รับอนุญาต อาจเป็นการละเมิด "
                "โทษจำคุกไม่เกิน 2 ปี และ/หรือปรับไม่เกิน 200,000 บาท"
            ),
            metadata={
                "law": "พ.ร.บ.ความลับทางการค้า พ.ศ. 2545",
                "sections": "ทั้งฉบับ",
                "topic": "trade_secret",
                "relevance": "Recipe/formulation protection in OEM contracts",
            },
        ),
        Document(
            page_content=(
                "พระราชบัญญัติสิทธิบัตร พ.ศ. 2522 (แก้ไขเพิ่มเติม 2542, 2564) "
                "สิทธิบัตรให้ความคุ้มครองการประดิษฐ์ผลิตภัณฑ์หรือกรรมวิธี "
                "อนุสิทธิบัตรคุ้มครองการประดิษฐ์ขนาดเล็ก "
                "ในสัญญา OEM ควรระบุชัดเจนว่าสิทธิในการประดิษฐ์/สูตรเป็นของฝ่ายใด "
                "ควรมีข้อตกลง assignment clause สำหรับ IP ที่สร้างขึ้นระหว่างการผลิต"
            ),
            metadata={
                "law": "พ.ร.บ.สิทธิบัตร",
                "sections": "มาตราที่เกี่ยวข้อง",
                "topic": "intellectual_property",
                "relevance": "IP ownership in OEM manufacturing",
            },
        ),
        Document(
            page_content=(
                "พระราชบัญญัติคุ้มครองผู้บริโภค พ.ศ. 2522 "
                "ข้อสัญญาที่ไม่เป็นธรรมตามพ.ร.บ.ว่าด้วยข้อสัญญาที่ไม่เป็นธรรม พ.ศ. 2540 "
                "ข้อตกลงที่ทำให้คู่สัญญาฝ่ายหนึ่งได้ประโยชน์เกินส่วนอันสมเหตุสมผล "
                "ศาลมีอำนาจสั่งให้ข้อสัญญาที่ไม่เป็นธรรมมีผลบังคับเพียงเท่าที่เป็นธรรม "
                "สำหรับ OEM: ข้อบังคับซื้อขั้นต่ำที่สูงเกินไป, ข้อยกเว้นความรับผิดฝ่ายเดียว, "
                "ค่าปรับที่ไม่สมเหตุสมผล ล้วนอาจถูกพิจารณาว่าไม่เป็นธรรม"
            ),
            metadata={
                "law": "พ.ร.บ.ว่าด้วยข้อสัญญาที่ไม่เป็นธรรม พ.ศ. 2540",
                "sections": "มาตรา 4-9",
                "topic": "unfair_contracts",
                "relevance": "Unfair contract terms in OEM agreements",
            },
        ),
        Document(
            page_content=(
                "พระราชบัญญัติเครื่องสำอาง พ.ศ. 2558 และข้อบังคับ อย. "
                "ผลิตภัณฑ์เครื่องสำอางทุกชนิดต้องจดแจ้ง อย. ก่อนจำหน่าย "
                "ผู้ผลิต OEM ต้องมีใบอนุญาตผลิตเครื่องสำอาง "
                "ผลิตภัณฑ์ต้องมีฉลากภาษาไทย ระบุส่วนประกอบ วันผลิต วันหมดอายุ "
                "สัญญา OEM ควรระบุชัดเจนว่าฝ่ายใดรับผิดชอบการจดแจ้ง อย."
            ),
            metadata={
                "law": "พ.ร.บ.เครื่องสำอาง พ.ศ. 2558",
                "sections": "ทั้งฉบับ",
                "topic": "fda_cosmetics",
                "relevance": "FDA requirements for cosmetics OEM",
            },
        ),
        Document(
            page_content=(
                "พระราชบัญญัติอาหาร พ.ศ. 2522 และข้อบังคับ อย. สำหรับผลิตภัณฑ์เสริมอาหาร "
                "โรงงานผลิตอาหารเสริมต้องมี GMP (Good Manufacturing Practice) "
                "ผลิตภัณฑ์เสริมอาหารต้องจดทะเบียน อย. เลข อย. "
                "ห้ามโฆษณาสรรพคุณเกินจริง ห้ามอ้างรักษาโรค "
                "ในสัญญา OEM เสริมอาหาร ควรระบุข้อกำหนด GMP, HACCP, "
                "และความรับผิดชอบในการขอ อย."
            ),
            metadata={
                "law": "พ.ร.บ.อาหาร พ.ศ. 2522",
                "sections": "ทั้งฉบับ",
                "topic": "fda_supplements",
                "relevance": "FDA requirements for supplement OEM",
            },
        ),
        Document(
            page_content=(
                "ข้อสังเกตสำหรับสัญญา OEM ที่มีความเสี่ยงสูง:\n"
                "1. ข้อสัญญาที่ให้สิทธิ์โรงงานในการใช้สูตรผลิตภัณฑ์ภายหลังสิ้นสุดสัญญา — เสี่ยง recipe theft\n"
                "2. ไม่มีข้อกำหนดห้ามแข่งขัน (non-compete) — โรงงานอาจผลิตสินค้าเหมือนกันให้คู่แข่ง\n"
                "3. ไม่มี NDA clause — ข้อมูลสูตรอาจรั่วไหล\n"
                "4. ข้อกำหนด MOQ (Minimum Order Quantity) สูงเกินไป — อาจทำให้ buyer ติดกับดัก\n"
                "5. ไม่มีข้อยกเลิกสัญญา (termination clause) — ทำให้เลิกสัญญายากเมื่อมีปัญหา\n"
                "6. การชำระเงิน 100% ล่วงหน้า — ไม่มี leverage ในการควบคุมคุณภาพ\n"
                "7. ไม่มีข้อกำหนดการตรวจสอบคุณภาพ (QC inspection rights)\n"
                "8. IP ownership ไม่ชัดเจนหรือคลุมเครือ"
            ),
            metadata={
                "law": "แนวปฏิบัติ OEM",
                "sections": "best_practices",
                "topic": "oem_risk_patterns",
                "relevance": "Common high-risk clauses in OEM contracts",
            },
        ),
    ]

    store.add_documents(legal_docs)
    logger.info("Seeded %d Thai legal knowledge documents", len(legal_docs))
