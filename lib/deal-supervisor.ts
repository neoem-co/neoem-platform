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
}: DealSupervisorInput): DealSupervisorState {
    const dealSheet = extractContext?.deal_sheet || null;
    const pendingItems: string[] = [];
    const blockers: string[] = [];
    const summaryItems: { label: string; value: string }[] = [];

    addIfMissing(pendingItems, !dealSheet?.client?.name, "Confirm buyer identity");
    addIfMissing(pendingItems, !dealSheet?.vendor?.name, "Confirm seller identity");
    addIfMissing(pendingItems, !dealSheet?.delivery_address, "Confirm delivery address");
    addIfMissing(pendingItems, !dealSheet?.payment_milestones?.length, "Lock payment milestones");
    addIfMissing(pendingItems, !dealSheet?.quality_terms?.qc_basis, "Define QC acceptance basis");
    addIfMissing(pendingItems, !dealSheet?.regulatory_terms?.registration_owner, "Assign FDA / regulatory owner");
    addIfMissing(pendingItems, !hasContractInChat && !completedActions.includes("draft"), "Create first contract draft");

    if (riskAlert && (riskAlert.level === "critical" || riskAlert.level === "high")) {
        blockers.push("High-risk contract issues should be reviewed before payment.");
    }
    if (!depositPaid && hasContractInChat) {
        blockers.push("Deposit is still pending.");
    }

    addSummaryItem(summaryItems, "Buyer", dealSheet?.client?.company || dealSheet?.client?.name || null);
    addSummaryItem(summaryItems, "Seller", dealSheet?.vendor?.company || dealSheet?.vendor?.name || null);
    addSummaryItem(summaryItems, "Product", dealSheet?.product?.name || null);
    addSummaryItem(summaryItems, "Packaging", dealSheet?.product?.packaging || null);
    addSummaryItem(summaryItems, "Payment", summarizePaymentTerms(dealSheet));
    addSummaryItem(summaryItems, "Delivery", dealSheet?.delivery_date || dealSheet?.delivery_weeks || null);
    addSummaryItem(summaryItems, "Regulatory", dealSheet?.regulatory_terms?.registration_owner || null);

    let currentState = "Initial chat alignment";
    if (dealSheet?.product?.name) currentState = "Deal terms captured";
    if (completedActions.includes("draft") || hasContractInChat) currentState = "Drafting / contract review";
    if (depositPaid) currentState = "Production kickoff ready";

    let nextAction = "Capture the core commercial terms from chat";
    if (pendingItems.length > 0) {
        nextAction = pendingItems[0];
    } else if (!completedActions.includes("draft")) {
        nextAction = "Open AI Draft to generate the first contract version";
    } else if (!depositPaid) {
        nextAction = "Review the contract and collect the deposit";
    } else {
        nextAction = "Move into production tracking and follow-up milestones";
    }

    return {
        currentState,
        nextAction,
        pendingItems,
        blockers,
        summaryItems,
    };
}
