import type { DealSheet, ExtractContextResponse } from "@/lib/ai-api";

type RiskAlertLike = {
    level: "critical" | "high" | "medium" | "low" | "safe";
    summary: string;
};

export interface DealSupervisorState {
    currentState: string;
    nextAction: string;
    pendingItems: string[];
    blockers: string[];
    summaryItems: { label: string; value: string }[];
}

interface DealSupervisorInput {
    extractContext: ExtractContextResponse | null;
    riskAlert: RiskAlertLike | null;
    depositPaid: boolean;
    completedActions: string[];
    hasContractInChat: boolean;
    isThai?: boolean;
}

function addIfMissing(pendingItems: string[], condition: boolean, value: string) {
    if (condition && !pendingItems.includes(value)) {
        pendingItems.push(value);
    }
}

function addSummaryItem(summaryItems: { label: string; value: string }[], label: string, value?: string | null) {
    if (!value) return;
    summaryItems.push({ label, value });
}

function summarizePaymentTerms(dealSheet: DealSheet | null) {
    if (!dealSheet?.payment_milestones?.length) {
        return dealSheet?.commercial_terms?.payment_terms_summary || "";
    }
    return dealSheet.payment_milestones
        .map((milestone) => {
            const amount = milestone.amount_percentage
                ? `${milestone.amount_percentage}%`
                : milestone.amount_fixed
                    ? `฿${milestone.amount_fixed.toLocaleString()}`
                    : milestone.label || "Milestone";
            return `${amount} ${milestone.due_event || milestone.label || ""}`.trim();
        })
        .join(" / ");
}

export function deriveDealSupervisorState({
    extractContext,
    riskAlert,
    depositPaid,
    completedActions,
    hasContractInChat,
    isThai = false,
}: DealSupervisorInput): DealSupervisorState {
    const dealSheet = extractContext?.deal_sheet || null;
    const pendingItems: string[] = [];
    const blockers: string[] = [];
    const summaryItems: { label: string; value: string }[] = [];

    addIfMissing(pendingItems, !dealSheet?.client?.name, isThai ? "ยืนยันข้อมูลผู้ซื้อ" : "Confirm buyer identity");
    addIfMissing(pendingItems, !dealSheet?.vendor?.name, isThai ? "ยืนยันข้อมูลผู้ขาย / โรงงาน" : "Confirm seller identity");
    addIfMissing(pendingItems, !dealSheet?.delivery_address, isThai ? "ยืนยันที่อยู่จัดส่ง" : "Confirm delivery address");
    addIfMissing(pendingItems, !dealSheet?.payment_milestones?.length, isThai ? "สรุปงวดชำระเงินให้ชัดเจน" : "Lock payment milestones");
    addIfMissing(pendingItems, !dealSheet?.quality_terms?.qc_basis, isThai ? "กำหนดเกณฑ์ QC / การตรวจรับ" : "Define QC acceptance basis");
    addIfMissing(pendingItems, !dealSheet?.regulatory_terms?.registration_owner, isThai ? "ระบุผู้รับผิดชอบ อย. / regulatory" : "Assign FDA / regulatory owner");
    addIfMissing(pendingItems, !hasContractInChat && !completedActions.includes("draft"), isThai ? "สร้างร่างสัญญาฉบับแรก" : "Create first contract draft");

    if (riskAlert && (riskAlert.level === "critical" || riskAlert.level === "high")) {
        blockers.push(isThai ? "ควรทบทวนประเด็นความเสี่ยงสูงในสัญญาก่อนชำระเงิน" : "High-risk contract issues should be reviewed before payment.");
    }
    if (!depositPaid && hasContractInChat) {
        blockers.push(isThai ? "ยังไม่ได้ชำระเงินมัดจำ" : "Deposit is still pending.");
    }

    addSummaryItem(summaryItems, isThai ? "ผู้ซื้อ" : "Buyer", dealSheet?.client?.company || dealSheet?.client?.name || null);
    addSummaryItem(summaryItems, isThai ? "ผู้ขาย / โรงงาน" : "Seller", dealSheet?.vendor?.company || dealSheet?.vendor?.name || null);
    addSummaryItem(summaryItems, isThai ? "สินค้า" : "Product", dealSheet?.product?.name || null);
    addSummaryItem(summaryItems, isThai ? "บรรจุภัณฑ์" : "Packaging", dealSheet?.product?.packaging || null);
    addSummaryItem(summaryItems, isThai ? "การชำระเงิน" : "Payment", summarizePaymentTerms(dealSheet));
    addSummaryItem(summaryItems, isThai ? "กำหนดส่ง" : "Delivery", dealSheet?.delivery_date || dealSheet?.delivery_weeks || null);
    addSummaryItem(summaryItems, isThai ? "Regulatory" : "Regulatory", dealSheet?.regulatory_terms?.registration_owner || null);

    let currentState = isThai ? "เริ่มต้นเก็บข้อมูลดีล" : "Initial chat alignment";
    if (dealSheet?.product?.name) currentState = isThai ? "จับข้อตกลงของดีลได้แล้ว" : "Deal terms captured";
    if (completedActions.includes("draft") || hasContractInChat) currentState = isThai ? "อยู่ในขั้นร่าง / รีวิวสัญญา" : "Drafting / contract review";
    if (depositPaid) currentState = isThai ? "พร้อมเริ่มโปรดักชัน" : "Production kickoff ready";

    let nextAction = isThai ? "สรุปข้อตกลงหลักจากบทสนทนา" : "Capture the core commercial terms from chat";
    if (pendingItems.length > 0) {
        nextAction = pendingItems[0];
    } else if (!completedActions.includes("draft")) {
        nextAction = isThai ? "เปิด AI Draft เพื่อสร้างร่างสัญญาฉบับแรก" : "Open AI Draft to generate the first contract version";
    } else if (!depositPaid) {
        nextAction = isThai ? "ทบทวนสัญญาและดำเนินการรับมัดจำ" : "Review the contract and collect the deposit";
    } else {
        nextAction = isThai ? "เข้าสู่ขั้นติดตามโปรดักชันและ milestone ถัดไป" : "Move into production tracking and follow-up milestones";
    }

    return {
        currentState,
        nextAction,
        pendingItems,
        blockers,
        summaryItems,
    };
}
