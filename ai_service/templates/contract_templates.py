"""
Thai contract template definitions.
Each template defines the expected articles structure for a contract type.
Templates are versioned JSON — can be updated without code changes.
"""

from __future__ import annotations

from models.contract_draft import TemplateType

# ════════════════════════════════════════════════════════════════════════════════
#  Template registry
# ════════════════════════════════════════════════════════════════════════════════

TEMPLATES: dict[TemplateType, dict] = {
    # ── สัญญาซื้อขาย (Sales Contract) ────────────────────────────────────
    TemplateType.SALES_CONTRACT: {
        "id": "sales_contract_v1",
        "version": "1.0",
        "name_th": "สัญญาซื้อขาย",
        "name_en": "Sales Contract",
        "description_th": "สัญญาซื้อขายผลิตภัณฑ์ OEM มาตรฐาน",
        "description_en": "Standard OEM product purchase agreement",
        "required_articles": [
            {
                "article_number": 1,
                "title_th": "คู่สัญญา",
                "title_en": "Parties",
                "description": "ระบุชื่อ ที่อยู่ และข้อมูลของคู่สัญญาทั้งสองฝ่าย",
                "placeholder_fields": ["vendor_name", "client_name", "vendor_address", "client_address"],
            },
            {
                "article_number": 2,
                "title_th": "วัตถุประสงค์และขอบเขต",
                "title_en": "Purpose and Scope",
                "description": "ระบุวัตถุประสงค์ของสัญญาและขอบเขตผลิตภัณฑ์",
                "placeholder_fields": ["product_name", "product_specs", "quantity"],
            },
            {
                "article_number": 3,
                "title_th": "ราคาและการชำระเงิน",
                "title_en": "Price and Payment",
                "description": "ระบุราคา วิธีการชำระเงิน และกำหนดชำระ",
                "placeholder_fields": ["total_price", "currency", "payment_terms"],
            },
            {
                "article_number": 4,
                "title_th": "การส่งมอบ",
                "title_en": "Delivery",
                "description": "ระบุกำหนดการส่งมอบ สถานที่ และเงื่อนไข",
                "placeholder_fields": ["delivery_date", "delivery_location"],
            },
            {
                "article_number": 5,
                "title_th": "การประกันคุณภาพ",
                "title_en": "Quality Assurance",
                "description": "ข้อกำหนด QC, inspection rights, มาตรฐานที่ต้องผ่าน",
                "placeholder_fields": ["quality_standards", "inspection_terms"],
            },
            {
                "article_number": 6,
                "title_th": "การรับประกัน",
                "title_en": "Warranty",
                "description": "ระยะเวลาและเงื่อนไขการรับประกันสินค้า",
                "placeholder_fields": ["warranty_period"],
            },
            {
                "article_number": 7,
                "title_th": "เงื่อนไขการยกเลิกสัญญา",
                "title_en": "Termination",
                "description": "เงื่อนไขที่คู่สัญญาสามารถยกเลิกสัญญาได้",
                "placeholder_fields": [],
            },
            {
                "article_number": 8,
                "title_th": "บทลงโทษ",
                "title_en": "Penalty",
                "description": "ค่าปรับกรณีผิดสัญญา ส่งมอบช้า หรือคุณภาพไม่ผ่าน",
                "placeholder_fields": ["penalty_rate", "penalty_type"],
            },
            {
                "article_number": 9,
                "title_th": "เงื่อนไขทั่วไป",
                "title_en": "General Provisions",
                "description": "กฎหมายที่ใช้บังคับ เขตอำนาจศาล และข้อกำหนดอื่นๆ",
                "placeholder_fields": [],
            },
        ],
    },

    # ── สัญญาจ้างทำของ (Hire of Work Contract) ───────────────────────────
    TemplateType.HIRE_OF_WORK: {
        "id": "hire_of_work_v1",
        "version": "1.0",
        "name_th": "สัญญาจ้างทำของ",
        "name_en": "Hire of Work Contract",
        "description_th": "สัญญาจ้างผลิตตามสั่ง (OEM) ตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 587",
        "description_en": "OEM manufacturing contract under Thai CCC Section 587",
        "required_articles": [
            {"article_number": 1, "title_th": "คู่สัญญา", "title_en": "Parties", "description": "ผู้ว่าจ้างและผู้รับจ้าง", "placeholder_fields": ["vendor_name", "client_name"]},
            {"article_number": 2, "title_th": "ขอบเขตงาน", "title_en": "Scope of Work", "description": "รายละเอียดผลิตภัณฑ์ที่ต้องผลิต", "placeholder_fields": ["product_name", "product_specs"]},
            {"article_number": 3, "title_th": "ราคาและสินจ้าง", "title_en": "Price and Compensation", "description": "ค่าจ้างและเงื่อนไขการชำระ", "placeholder_fields": ["total_price"]},
            {"article_number": 4, "title_th": "การส่งมอบงาน", "title_en": "Delivery of Work", "description": "กำหนดส่งมอบและเงื่อนไขการตรวจรับ", "placeholder_fields": ["delivery_date"]},
            {"article_number": 5, "title_th": "การประกันคุณภาพ", "title_en": "Quality Assurance", "description": "มาตรฐานคุณภาพและการตรวจสอบ", "placeholder_fields": []},
            {"article_number": 6, "title_th": "ทรัพย์สินทางปัญญา", "title_en": "Intellectual Property", "description": "กรรมสิทธิ์ในสูตร, สิทธิบัตร, ความลับทางการค้า", "placeholder_fields": ["ip_ownership"]},
            {"article_number": 7, "title_th": "การรักษาความลับ", "title_en": "Confidentiality", "description": "ข้อกำหนดห้ามเปิดเผยข้อมูลความลับ", "placeholder_fields": []},
            {"article_number": 8, "title_th": "ข้อห้ามแข่งขัน", "title_en": "Non-Compete", "description": "ห้ามผลิตสินค้าเหมือนกันให้คู่แข่ง", "placeholder_fields": []},
            {"article_number": 9, "title_th": "เงื่อนไขการยกเลิก", "title_en": "Termination", "description": "เงื่อนไขการเลิกสัญญา", "placeholder_fields": []},
            {"article_number": 10, "title_th": "บทลงโทษ", "title_en": "Penalty", "description": "ค่าปรับกรณีผิดสัญญา", "placeholder_fields": ["penalty_rate"]},
            {"article_number": 11, "title_th": "เงื่อนไขทั่วไป", "title_en": "General Provisions", "description": "กฎหมายที่ใช้บังคับ", "placeholder_fields": []},
        ],
    },

    # ── สัญญาไม่เปิดเผยข้อมูล (NDA) ─────────────────────────────────────
    TemplateType.NDA: {
        "id": "nda_v1",
        "version": "1.0",
        "name_th": "สัญญาไม่เปิดเผยข้อมูล",
        "name_en": "Non-Disclosure Agreement (NDA)",
        "description_th": "สัญญาป้องกันการเปิดเผยความลับทางการค้าและสูตรผลิตภัณฑ์",
        "description_en": "Mutual NDA protecting trade secrets and product formulations",
        "required_articles": [
            {"article_number": 1, "title_th": "คู่สัญญา", "title_en": "Parties", "description": "ผู้เปิดเผยและผู้รับข้อมูล", "placeholder_fields": ["vendor_name", "client_name"]},
            {"article_number": 2, "title_th": "นิยาม", "title_en": "Definitions", "description": "คำจำกัดความ 'ข้อมูลเป็นความลับ'", "placeholder_fields": []},
            {"article_number": 3, "title_th": "ขอบเขตของข้อมูลที่เป็นความลับ", "title_en": "Scope of Confidential Information", "description": "ระบุประเภทข้อมูลที่ครอบคลุม", "placeholder_fields": []},
            {"article_number": 4, "title_th": "หน้าที่ในการรักษาความลับ", "title_en": "Obligations", "description": "ภาระผูกพันของผู้รับข้อมูล", "placeholder_fields": []},
            {"article_number": 5, "title_th": "ข้อยกเว้น", "title_en": "Exceptions", "description": "กรณีที่ไม่ถือเป็นการละเมิด", "placeholder_fields": []},
            {"article_number": 6, "title_th": "ระยะเวลา", "title_en": "Duration", "description": "อายุของสัญญา NDA", "placeholder_fields": ["nda_duration"]},
            {"article_number": 7, "title_th": "การเยียวยาและบทลงโทษ", "title_en": "Remedies and Penalties", "description": "ค่าเสียหายกรณีละเมิด", "placeholder_fields": []},
            {"article_number": 8, "title_th": "เงื่อนไขทั่วไป", "title_en": "General Provisions", "description": "กฎหมายที่ใช้บังคับ", "placeholder_fields": []},
        ],
    },

    # ── สัญญาแต่งตั้งตัวแทนจำหน่าย (Distribution) ────────────────────────
    TemplateType.DISTRIBUTION: {
        "id": "distribution_v1",
        "version": "1.0",
        "name_th": "สัญญาแต่งตั้งตัวแทนจำหน่าย",
        "name_en": "Distribution Agreement",
        "description_th": "สัญญาแต่งตั้งตัวแทนจำหน่ายผลิตภัณฑ์ OEM",
        "description_en": "OEM product distribution agreement",
        "required_articles": [
            {"article_number": 1, "title_th": "คู่สัญญา", "title_en": "Parties", "description": "ผู้ผลิตและผู้จำหน่าย", "placeholder_fields": ["vendor_name", "client_name"]},
            {"article_number": 2, "title_th": "การแต่งตั้ง", "title_en": "Appointment", "description": "ขอบเขตการแต่งตั้งเป็นตัวแทน", "placeholder_fields": []},
            {"article_number": 3, "title_th": "เขตพื้นที่", "title_en": "Territory", "description": "เขตพื้นที่จำหน่าย", "placeholder_fields": []},
            {"article_number": 4, "title_th": "ราคาและเงื่อนไข", "title_en": "Pricing and Terms", "description": "ราคาขายส่ง, ส่วนลด", "placeholder_fields": ["total_price"]},
            {"article_number": 5, "title_th": "ยอดสั่งซื้อขั้นต่ำ", "title_en": "Minimum Order", "description": "MOQ และเป้าการขาย", "placeholder_fields": []},
            {"article_number": 6, "title_th": "การส่งมอบ", "title_en": "Delivery", "description": "เงื่อนไขการจัดส่ง", "placeholder_fields": ["delivery_date"]},
            {"article_number": 7, "title_th": "ทรัพย์สินทางปัญญาและเครื่องหมายการค้า", "title_en": "IP and Trademarks", "description": "สิทธิ์การใช้เครื่องหมายการค้า", "placeholder_fields": []},
            {"article_number": 8, "title_th": "เงื่อนไขการยกเลิก", "title_en": "Termination", "description": "เงื่อนไขการเลิกสัญญา", "placeholder_fields": []},
            {"article_number": 9, "title_th": "เงื่อนไขทั่วไป", "title_en": "General Provisions", "description": "กฎหมายที่ใช้บังคับ", "placeholder_fields": []},
        ],
    },

    # ── สัญญา Hybrid OEM ─────────────────────────────────────────────────
    TemplateType.HYBRID_OEM: {
        "id": "hybrid_oem_v1",
        "version": "1.0",
        "name_th": "สัญญา OEM แบบผสม",
        "name_en": "Hybrid OEM Agreement",
        "description_th": "สัญญา OEM ผสมระหว่างจ้างผลิตและแบ่งปัน IP",
        "description_en": "Hybrid OEM agreement combining manufacturing and IP sharing",
        "required_articles": [
            {"article_number": 1, "title_th": "คู่สัญญา", "title_en": "Parties", "description": "ผู้ว่าจ้างและผู้รับจ้าง", "placeholder_fields": ["vendor_name", "client_name"]},
            {"article_number": 2, "title_th": "ขอบเขตงาน", "title_en": "Scope of Work", "description": "รายละเอียดการผลิต", "placeholder_fields": ["product_name"]},
            {"article_number": 3, "title_th": "ราคาและการชำระเงิน", "title_en": "Price and Payment", "description": "ค่าจ้างผลิต", "placeholder_fields": ["total_price"]},
            {"article_number": 4, "title_th": "การส่งมอบ", "title_en": "Delivery", "description": "กำหนดการส่งมอบ", "placeholder_fields": ["delivery_date"]},
            {"article_number": 5, "title_th": "การประกันคุณภาพ", "title_en": "Quality Assurance", "description": "มาตรฐาน QC", "placeholder_fields": []},
            {"article_number": 6, "title_th": "ทรัพย์สินทางปัญญา (IP Sharing)", "title_en": "Intellectual Property Sharing", "description": "การแบ่งปันและกรรมสิทธิ์ใน IP", "placeholder_fields": ["ip_ownership"]},
            {"article_number": 7, "title_th": "การรักษาความลับ", "title_en": "Confidentiality", "description": "ข้อตกลง NDA ที่ฝังในสัญญา", "placeholder_fields": []},
            {"article_number": 8, "title_th": "ข้อห้ามแข่งขัน", "title_en": "Non-Compete", "description": "ข้อจำกัดการแข่งขัน", "placeholder_fields": []},
            {"article_number": 9, "title_th": "เงื่อนไขการยกเลิก", "title_en": "Termination", "description": "เงื่อนไขการเลิกสัญญาและการส่งคืน IP", "placeholder_fields": []},
            {"article_number": 10, "title_th": "บทลงโทษ", "title_en": "Penalty", "description": "ค่าปรับรวมถึงการละเมิด IP", "placeholder_fields": ["penalty_rate"]},
            {"article_number": 11, "title_th": "เงื่อนไขทั่วไป", "title_en": "General Provisions", "description": "กฎหมายที่ใช้บังคับ", "placeholder_fields": []},
        ],
    },
}


def get_template(template_type: TemplateType) -> dict:
    """Retrieve a contract template by type."""
    return TEMPLATES.get(template_type, TEMPLATES[TemplateType.SALES_CONTRACT])


def list_templates() -> list[dict]:
    """Return summary of all available templates."""
    return [
        {
            "type": ttype.value,
            "name_th": tmpl["name_th"],
            "name_en": tmpl["name_en"],
            "description_th": tmpl["description_th"],
            "description_en": tmpl["description_en"],
            "article_count": len(tmpl["required_articles"]),
        }
        for ttype, tmpl in TEMPLATES.items()
    ]
