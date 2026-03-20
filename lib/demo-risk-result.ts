import type { RiskCheckResponse } from "@/lib/ai-api";

export const DEMO_RISK_RESPONSE: RiskCheckResponse = {
  overall_risk: "high",
  risk_score: 79,
  risks: [
    {
      risk_id: "demo-risk-payment-1",
      clause_ref: "ข้อ 4",
      level: "high",
      confidence: 0.93,
      title_th: "เงื่อนไขการชำระเงินยังไม่ผูกกับ milestone การตรวจรับอย่างชัดเจน",
      title_en: "Payment milestones are not tightly tied to acceptance events",
      description_th:
        "พบการกำหนดงวดชำระเงินล่วงหน้าค่อนข้างสูง แต่ยังไม่ระบุสิทธิระงับการชำระเงินหรือเงื่อนไขหักชำระหากสินค้าไม่ผ่านการตรวจรับหรือส่งมอบล่าช้า",
      description_en:
        "The contract requires a significant advance payment but does not clearly give the buyer a withholding right for late delivery or failed acceptance.",
      recommendation_th:
        "เพิ่ม acceptance milestone, สิทธิระงับการชำระเงิน และกลไกหักค่าปรับเมื่อส่งมอบล่าช้าหรือสินค้าไม่เป็นไปตาม spec",
      recommendation_en:
        "Add an acceptance milestone, a withholding right, and a clear late-delivery penalty setoff mechanism.",
      category: "payment",
      anchors: [
        {
          page: 1,
          x: 0.04,
          y: 0.12,
          width: 0.001,
          height: 0.001,
          snippet: "ข้อ 4 การชำระเงิน",
        },
      ],
      legal_refs: [],
    },
    {
      risk_id: "demo-risk-qc-1",
      clause_ref: "ข้อ 7",
      level: "medium",
      confidence: 0.89,
      title_th: "กลไกการตรวจรับและการเคลมสินค้ายังไม่ละเอียดพอ",
      title_en: "Inspection and claim procedure is still too thin",
      description_th:
        "ยังไม่พบรายละเอียดเรื่องช่วงเวลาตรวจรับ วิธีแจ้ง defect และภาระหน้าที่ของโรงงานในการ rework หรือ replace เมื่อสินค้าไม่ผ่านมาตรฐาน",
      description_en:
        "The inspection window, defect notice process, and the factory's rework or replacement obligations are not defined in enough detail.",
      recommendation_th:
        "ระบุ inspection window, defect notice procedure, rework/replace timeline และเกณฑ์ reject ให้ชัดเจน",
      recommendation_en:
        "Define the inspection window, defect notice process, rework/replace timeline, and rejection criteria more clearly.",
      category: "quality",
      anchors: [
        {
          page: 2,
          x: 0.04,
          y: 0.14,
          width: 0.001,
          height: 0.001,
          snippet: "ข้อ 7 การตรวจรับสินค้า",
        },
      ],
      legal_refs: [],
    },
  ],
  acceptable_findings: [
    {
      risk_id: "demo-acceptable-ip-1",
      clause_ref: "ข้อ 9",
      level: "safe",
      confidence: 0.91,
      title_th: "มีการกำหนดเรื่องกรรมสิทธิ์ในสูตรและทรัพย์สินทางปัญญาแล้ว",
      title_en: "IP ownership is already covered",
      description_th:
        "สัญญามีการกล่าวถึงความเป็นเจ้าของสูตร ผลงาน และ artwork อยู่แล้วในระดับหนึ่ง ซึ่งช่วยลดความเสี่ยงเรื่องทรัพย์สินทางปัญญา",
      description_en:
        "The contract already addresses ownership of the formula, deliverables, and artwork at a workable level.",
      recommendation_th: "คงหลักการเดิมไว้ และอาจเพิ่มเรื่องการคืน tooling หากมีการผลิตแม่พิมพ์หรืออุปกรณ์เฉพาะ",
      recommendation_en:
        "Keep the current IP clause and optionally add tooling-return language if custom molds or tools are used.",
      category: "ip",
      anchors: [
        {
          page: 3,
          x: 0.04,
          y: 0.16,
          width: 0.001,
          height: 0.001,
          snippet: "ข้อ 9 ทรัพย์สินทางปัญญา",
        },
      ],
      legal_refs: [],
    },
  ],
  mismatches: [],
  legal_checklist: [],
  summary_th:
    "สัญญาฉบับนี้มีโครงสร้างโดยรวมค่อนข้างดี แต่ยังควรเจรจาเพิ่มเติมเรื่อง payment milestone และกระบวนการตรวจรับสินค้า เพื่อให้คุ้มครองผู้ซื้อได้ชัดเจนมากขึ้นก่อนนำไปใช้จริง",
  summary_en:
    "This contract is structurally solid overall, but the payment and acceptance mechanics should be tightened before real use.",
  contract_type: "hire_of_work",
  processing_time_seconds: 0.18,
};
