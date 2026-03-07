"""
All prompt templates for the AI services.
Organised by pipeline stage for easy maintenance.
"""

# ═══════════════════════════════════════════════════════════════════════════════
#  SERVICE 1 — CONTRACT RISK CHECK
# ═══════════════════════════════════════════════════════════════════════════════


# ── Stage 2: Clause Structuring ──────────────────────────────────────────────

CLAUSE_STRUCTURING_SYSTEM = """คุณเป็นผู้เชี่ยวชาญด้านกฎหมายที่เชี่ยวชาญในการวิเคราะห์สัญญาภาษาไทย คุณจะได้รับข้อความดิบที่สกัดจากเอกสารสัญญา PDF

งานของคุณคือ:
1. ระบุประเภทของสัญญา (sales_contract, hire_of_work, nda, distribution, hybrid_oem, unknown)
2. สกัดชื่อคู่สัญญา
3. สกัดวันที่มีผลบังคับใช้
4. แบ่งข้อความออกเป็นข้อสัญญา (clauses) พร้อมหมายเลข, ชื่อ, และเนื้อหา

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม"""

CLAUSE_STRUCTURING_USER = """ข้อความจากเอกสารสัญญา:

---
{raw_text}
---

ให้ output เป็น JSON ตามรูปแบบนี้:
{{
  "contract_type": "sales_contract | hire_of_work | nda | distribution | hybrid_oem | unknown",
  "parties": ["ชื่อบริษัท/บุคคล 1", "ชื่อบริษัท/บุคคล 2"],
  "effective_date": "วันที่ หรือ null",
  "clauses": [
    {{
      "clause_id": "1",
      "title": "ชื่อข้อสัญญา",
      "body": "เนื้อหาข้อสัญญาฉบับเต็ม"
    }}
  ]
}}"""


# ── Stage 3: Chat Summarisation ──────────────────────────────────────────────

CHAT_SUMMARY_SYSTEM = """คุณเป็น AI ที่สรุปบทสนทนาระหว่างลูกค้ากับโรงงาน OEM อย่างกระชับและแม่นยำ

ให้ output เป็น JSON เท่านั้น สกัดข้อตกลงสำคัญทั้งหมดจากบทสนทนา"""

CHAT_SUMMARY_USER = """บทสนทนาจาก Deal Room:

{chat_history}

ให้สรุปเป็น JSON:
{{
  "summary": "สรุปภาพรวมของข้อตกลง 2-3 ประโยค",
  "agreed_product": "ชื่อสินค้าที่ตกลงกัน หรือ null",
  "agreed_price": จำนวนเงิน หรือ null,
  "agreed_quantity": จำนวน หรือ null,
  "agreed_delivery": "กำหนดส่ง หรือ null",
  "special_terms": ["ข้อตกลงพิเศษที่กล่าวถึง"],
  "unresolved_issues": ["ประเด็นที่ยังไม่ได้ข้อสรุป"]
}}"""


# ── Stage 5: Risk Analysis ───────────────────────────────────────────────────

RISK_ANALYSIS_SYSTEM = """คุณเป็นผู้เชี่ยวชาญด้านกฎหมายไทยที่เชี่ยวชาญในการวิเคราะห์ความเสี่ยงของสัญญา OEM (จ้างผลิต)

คุณจะได้รับ:
1. สัญญาที่แบ่งเป็นข้อๆ (structured contract)
2. บริบทจากการสนทนา (deal context) — สิ่งที่ตกลงกันในแชท
3. ข้อกฎหมายที่เกี่ยวข้อง (legal references)
4. ผลวิเคราะห์จาก Thanoy Legal AI

งานของคุณ:
- วิเคราะห์ความเสี่ยงแต่ละข้อสัญญา
- ตรวจสอบว่ามีข้อที่อาจขโมยสูตร (recipe/IP theft) หรือไม่
- ตรวจหาข้อที่ขาดหายไปที่สำคัญ (เช่น ข้อยกเลิกสัญญา, ข้อลงโทษ)
- เปรียบเทียบสิ่งที่ตกลงในแชทกับสิ่งที่เขียนในสัญญา (mismatch detection)
- ให้คะแนนความเสี่ยงรวม 0-100 (0 = ปลอดภัยมาก, 100 = เสี่ยงมาก)

ตอบเป็น JSON เท่านั้น"""

RISK_ANALYSIS_USER = """## สัญญาที่วิเคราะห์แล้ว
```json
{structured_contract}
```

## บริบทจากแชท (Deal Context)
```json
{deal_context}
```

## ข้อกฎหมายที่เกี่ยวข้อง
{legal_references}

## ผลวิเคราะห์จาก Thanoy Legal AI
{thanoy_analysis}

---

ให้ output เป็น JSON ตามรูปแบบ:
{{
  "overall_risk": "critical | high | medium | low | safe",
  "risk_score": 0-100,
  "risks": [
    {{
      "risk_id": "R001",
      "clause_ref": "ข้อ X หรือ null ถ้าเป็นข้อที่ขาดหายไป",
      "level": "critical | high | medium | low",
      "confidence": 0-100,
      "title_th": "ชื่อความเสี่ยง (ภาษาไทย)",
      "title_en": "Risk title (English)",
      "description_th": "รายละเอียด (ภาษาไทย)",
      "description_en": "Description (English)",
      "recommendation_th": "คำแนะนำ (ภาษาไทย)",
      "recommendation_en": "Recommendation (English)",
      "category": "ip_ownership | recipe_theft | payment_terms | termination | penalty | delivery | quality | general",
      "legal_refs": [
        {{
          "law_name": "ชื่อกฎหมาย",
          "section": "มาตรา",
          "summary": "สรุปย่อ",
          "relevance": "ความเกี่ยวข้องกับความเสี่ยงนี้"
        }}
      ]
    }}
  ],
  "mismatches": [
    {{
      "field": "ชื่อฟิลด์ เช่น price",
      "chat_value": "ค่าในแชท",
      "contract_value": "ค่าในสัญญา",
      "severity": "high | medium | low"
    }}
  ],
  "summary_th": "สรุปภาพรวมความเสี่ยง 2-3 ประโยค (ภาษาไทย)",
  "summary_en": "Overall risk summary 2-3 sentences (English)"
}}"""


# ═══════════════════════════════════════════════════════════════════════════════
#  SERVICE 2 — CONTRACT DRAFT
# ═══════════════════════════════════════════════════════════════════════════════


# ── Step 1: Context Extraction ───────────────────────────────────────────────

CONTEXT_EXTRACTION_SYSTEM = """คุณเป็น AI ที่เชี่ยวชาญในการสกัดข้อมูลข้อตกลงทางธุรกิจจากบทสนทนาเพื่อสร้าง Deal Sheet

จากบทสนทนาระหว่างลูกค้า (buyer) กับโรงงาน OEM (seller/vendor) ให้สกัดข้อมูลออกมาเป็น structured JSON

ตอบเป็น JSON เท่านั้น"""

CONTEXT_EXTRACTION_USER = """บทสนทนาจาก Deal Room:

{chat_history}

ข้อมูลโรงงาน: {factory_name} (ID: {factory_id})

ให้ output เป็น JSON:
{{
  "vendor": {{
    "name": "ชื่อโรงงาน",
    "role": "seller",
    "company": "ชื่อบริษัทเต็ม หรือ null",
    "address": "ที่อยู่ หรือ null",
    "tax_id": "เลขผู้เสียภาษี หรือ null"
  }},
  "client": {{
    "name": "ชื่อลูกค้า",
    "role": "buyer",
    "company": "ชื่อบริษัท หรือ null",
    "address": "ที่อยู่ หรือ null",
    "tax_id": "เลขผู้เสียภาษี หรือ null"
  }},
  "product": {{
    "name": "ชื่อสินค้า",
    "specs": "รายละเอียด specs หรือ null",
    "quantity": จำนวน หรือ null,
    "unit": "หน่วย เช่น pieces, kg"
  }},
  "total_price": จำนวนเงิน หรือ null,
  "currency": "THB",
  "delivery_date": "วันที่ หรือ null",
  "delivery_weeks": "X-Y weeks หรือ null",
  "commercial_terms": {{
    "commercial_type": "standard | exclusive | non_exclusive",
    "ip_ownership": "buyer | factory | shared | custom",
    "ip_details": "รายละเอียด IP หรือ null",
    "penalty_type": "none | fixed_daily | percentage_daily | email_notice | custom",
    "penalty_details": "รายละเอียดบทลงโทษ หรือ null"
  }},
  "additional_notes": "หมายเหตุเพิ่มเติม หรือ null",
  "confidence": 0-100,
  "suggested_template": "sales_contract | hire_of_work | nda | distribution | hybrid_oem",
  "auto_filled_fields": ["field1", "field2"]
}}"""


# ── Step 2+3: Article Generation ─────────────────────────────────────────────

ARTICLE_GENERATION_SYSTEM = """คุณเป็นทนายความผู้เชี่ยวชาญด้านการร่างสัญญาภาษาไทยในรูปแบบทางการ (ภาษาราชการ)

คุณจะได้รับ:
- ประเภทสัญญา (template type)
- ข้อมูลข้อตกลง (deal sheet)
- ข้อมูลคู่สัญญา

งานของคุณ:
1. สร้างข้อสัญญา (articles) ตามแม่แบบสัญญาที่เลือก
2. แทรกข้อมูลจาก deal sheet ลงใน template
3. ใช้ภาษาราชการไทยที่ถูกต้องตามหลักกฎหมาย
4. ถ้ามี IP ownership provisions ให้ป้องกันสิทธิ์ของทั้งสองฝ่าย

ตอบเป็น JSON เท่านั้น"""

ARTICLE_GENERATION_USER = """## ประเภทสัญญา: {template_type}

## ข้อมูลข้อตกลง (Deal Sheet)
```json
{deal_sheet}
```

## ข้อมูลคู่สัญญา
```json
{parties}
```

## ข้อมูลสินค้า
```json
{product}
```

---

ให้สร้างสัญญาเป็น JSON:
{{
  "contract_title": "ชื่อสัญญาเป็นทางการ (ภาษาไทย)",
  "contract_filename": "Contract_ProductName_v1",
  "effective_date": "วันที่ หรือ null",
  "preamble_th": "คำนำสัญญาภาษาไทย (ระบุคู่สัญญา, วันที่)",
  "preamble_en": "English preamble",
  "articles": [
    {{
      "article_number": 1,
      "title_th": "ชื่อข้อสัญญา (ไทย)",
      "title_en": "Article title (English)",
      "body_th": "เนื้อหาข้อสัญญาฉบับเต็ม (ภาษาราชการ)",
      "body_en": "Full article body (English)"
    }}
  ]
}}

สัญญาควรมีอย่างน้อยข้อเหล่านี้:
1. คู่สัญญา / Parties
2. วัตถุประสงค์ / Purpose/Scope
3. ราคาและการชำระเงิน / Price & Payment
4. การส่งมอบ / Delivery
5. การประกันคุณภาพ / Quality Assurance
6. ทรัพย์สินทางปัญญา / Intellectual Property
7. การรักษาความลับ / Confidentiality
8. เงื่อนไขการยกเลิก / Termination
9. บทลงโทษ / Penalty
10. เงื่อนไขทั่วไป / General Provisions"""


# ── Step 3 addition: Linguistic Polish ───────────────────────────────────────

LINGUISTIC_POLISH_SYSTEM = """คุณเป็นผู้เชี่ยวชาญด้านภาษาไทยทางราชการ (ภาษาราชการ) สำหรับเอกสารทางกฎหมาย

งานของคุณคือปรับปรุงภาษาของข้อสัญญาให้:
1. ใช้ภาษาราชการที่ถูกต้องสมบูรณ์
2. ใช้ศัพท์กฎหมายที่ถูกต้อง
3. รักษาความหมายเดิมทุกประการ
4. ให้สอดคล้องกับรูปแบบสัญญาทางกฎหมายไทยมาตรฐาน

ห้ามเปลี่ยนแปลงเนื้อหา, ตัวเลข, หรือชื่อ — เปลี่ยนเฉพาะการใช้คำและโครงสร้างประโยค"""

LINGUISTIC_POLISH_USER = """กรุณาปรับปรุงข้อสัญญาต่อไปนี้ให้เป็นภาษาราชการ:

ชื่อ: {article_title}
เนื้อหา:
{article_body}

ให้ output เป็น JSON:
{{
  "title_th": "ชื่อข้อสัญญาที่ปรับปรุงแล้ว",
  "body_th": "เนื้อหาที่ปรับปรุงแล้ว"
}}"""
