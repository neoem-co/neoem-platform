"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
    FileText, Search, FolderClock, X, Upload, Loader2,
    AlertTriangle, CheckCircle2, Download, Eye,
    BadgeDollarSign, Sparkles, History, PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ESignaturePanel } from "@/components/legal/ESignaturePanel";
import { RiskPdfViewer, type RiskHighlight } from "@/components/legal/RiskPdfViewer";
import { DEMO_RISK_RESPONSE } from "@/lib/demo-risk-result";
import {
    analyzeContractRisk,
    downloadFile,
    explainRisk,
    extractContext,
    finalizeContract,
    generateDraft,
    getContractHistory,
    type ChatMessagePayload,
    type ContractArticle,
    type ContractHistoryItem,
    type DealSheet,
    type ExtractContextResponse,
    type FactoryInfoPayload,
    type GenerateDraftResponse,
    type RiskCheckResponse,
    type RiskExplainResponse,
    type RiskExplainRequest,
} from "@/lib/ai-api";

interface AILegalWorkspaceProps {
    open: boolean;
    onClose: () => void;
    factoryName?: string;
    initialTab?: "draft" | "risk" | "history" | "esign";
    chatHistory?: ChatMessagePayload[];
    factoryInfo?: FactoryInfoPayload;
    initialExtractContext?: ExtractContextResponse | null;
    managedExtractContext?: boolean;
    onDraftComplete?: () => void;
    onRiskAnalysisComplete?: (result: {
        overallRisk: RiskCheckResponse["overall_risk"];
        summary: string;
        highCount: number;
        mediumCount: number;
        lowCount: number;
    }) => void;
}

// ── Draft Contract types ──
interface ContractData {
    template: string;
    buyerName: string;
    buyerCompany: string;
    buyerAddress: string;
    buyerTaxId: string;
    sellerName: string;
    sellerCompany: string;
    sellerAddress: string;
    sellerTaxId: string;
    productType: string;
    productSpec: string;
    packaging: string;
    targetMarket: string;
    quantity: string;
    totalPrice: string;
    deliveryDate: string;
    deliveryAddress: string;
    penaltyClause: string;
    paymentTerms: string;
    qualityStandards: string;
    qcBasis: string;
    regulatoryResponsibility: string;
    warrantyPeriod: string;
    ipOwnership: string;
    additionalClauses: string;
}

interface ProgressStage {
    title: string;
    hint: string;
}

function useProgressStage(active: boolean, stages: ProgressStage[], intervalMs = 1700) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const resetTimer = window.setTimeout(() => setIndex(0), 0);
        if (!active || stages.length <= 1) {
            return () => window.clearTimeout(resetTimer);
        }

        const timer = window.setInterval(() => {
            setIndex((prev) => Math.min(prev + 1, stages.length - 1));
        }, intervalMs);

        return () => {
            window.clearTimeout(resetTimer);
            window.clearInterval(timer);
        };
    }, [active, intervalMs, stages.length]);

    return stages[Math.min(index, stages.length - 1)];
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy - radius * Math.sin(angleRad),
    };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function RiskGauge({
    percent,
    toneClass,
}: {
    percent: number;
    toneClass: string;
}) {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const svgWidth = 240;
    const svgHeight = 150;
    const cx = 120;
    const cy = 118;
    const radius = 92;
    const strokeWidth = 28;
    const needleAngle = 180 - (clampedPercent / 100) * 180;
    const needleInner = polarToCartesian(cx, cy, 62, needleAngle);
    const needleOuter = polarToCartesian(cx, cy, 90, needleAngle);

    return (
        <div className="relative mx-auto w-60 h-36">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-full w-full overflow-visible">
                <path
                    d={describeArc(cx, cy, radius, 180, 122)}
                    fill="none"
                    stroke="rgb(34 197 94)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                />
                <path
                    d={describeArc(cx, cy, radius, 118, 62)}
                    fill="none"
                    stroke="rgb(245 158 11)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                />
                <path
                    d={describeArc(cx, cy, radius, 58, 0)}
                    fill="none"
                    stroke="rgb(239 68 68)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                />

                <line
                    x1={needleInner.x}
                    y1={needleInner.y}
                    x2={needleOuter.x}
                    y2={needleOuter.y}
                    stroke="rgb(17 24 39)"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <circle cx={needleInner.x} cy={needleInner.y} r="5.5" fill="rgb(17 24 39)" />
            </svg>

            <div className="absolute inset-x-0 bottom-5 text-center">
                <p className={`text-[3.25rem] leading-none font-bold ${toneClass || "text-foreground"}`}>
                    {clampedPercent}%
                </p>
            </div>
        </div>
    );
}

const DRAFT_GENERATE_STAGES: ProgressStage[] = [
    { title: "กำลังวิเคราะห์บริบทดีล", hint: "ดึงประเด็นสำคัญจากแชทและข้อมูลข้อตกลง" },
    { title: "กำลังร่างข้อสัญญา", hint: "สร้างข้อสัญญาตามเทมเพลตให้ครบถ้วนเป็นระบบ" },
    { title: "กำลังปรับถ้อยคำทางกฎหมาย", hint: "ปรับภาษาให้เป็นทางการและอ่านเข้าใจง่าย" },
];

const DRAFT_FINALIZE_STAGES: ProgressStage[] = [
    { title: "กำลังเตรียมเอกสารฉบับสุดท้าย", hint: "รวมเนื้อหาฉบับร่างเป็นรูปแบบพร้อมใช้งาน" },
    { title: "กำลังสร้างไฟล์ PDF และ DOCX", hint: "เรนเดอร์เอกสารเพื่อดาวน์โหลดและใช้งานจริง" },
    { title: "กำลังบันทึกประวัติเอกสาร", hint: "จัดเก็บไฟล์และข้อมูลอ้างอิงใน Legal Hub" },
];

const RISK_ANALYZE_STAGES: ProgressStage[] = [
    { title: "กำลังรับไฟล์และอ่านเอกสาร", hint: "ดึงข้อความสัญญาเพื่อเตรียมวิเคราะห์" },
    { title: "กำลังจับคู่ข้อสัญญาและตำแหน่งไฮไลต์", hint: "ระบุจุดอ้างอิงและตำแหน่งในเอกสาร" },
    { title: "กำลังประเมินความเสี่ยงทางกฎหมาย", hint: "คำนวณระดับความเสี่ยงและสร้างสรุปภาษาไทย" },
    { title: "กำลังจัดทำผลลัพธ์", hint: "เตรียมการ์ดความเสี่ยง สรุปผล และข้อมูลแสดงผล" },
];

const EXPLAIN_RISK_STAGES: ProgressStage[] = [
    { title: "กำลังอ่านบริบทข้อเสี่ยง", hint: "วิเคราะห์รายละเอียดและหมวดหมู่ของประเด็น" },
    { title: "กำลังสรุปผลกระทบทางธุรกิจ", hint: "แปลผลเชิงธุรกิจและความเสี่ยงที่อาจเกิดขึ้น" },
    { title: "กำลังสร้างคำอธิบายภาษาไทย", hint: "จัดรูปคำอธิบายให้ชัดเจนและเข้าใจง่าย" },
];

const TEMPLATE_META = [
    { id: "sales", labelTh: "สัญญาซื้อขาย", labelEn: "Sales Contract", icon: "📝" },
    { id: "hire-of-work", labelTh: "สัญญาจ้างทำของ", labelEn: "Hire of Work", icon: "🔧" },
    { id: "distribution", labelTh: "สัญญาตัวแทนจำหน่าย", labelEn: "Distribution", icon: "📦" },
] as const;

function getTemplateOptions(isThai: boolean) {
    return TEMPLATE_META.map((template) => ({
        ...template,
        label: isThai
            ? `${template.labelTh} / ${template.labelEn}`
            : `${template.labelEn} / ${template.labelTh}`,
    }));
}

function getTemplateDisplayLabel(templateId: string | null | undefined, isThai: boolean) {
    const template = TEMPLATE_META.find((item) => item.id === templateId);
    if (!template) {
        return isThai ? "สัญญาจ้างทำของ / Hire of Work" : "Hire of Work / สัญญาจ้างทำของ";
    }
    return isThai
        ? `${template.labelTh} / ${template.labelEn}`
        : `${template.labelEn} / ${template.labelTh}`;
}

function formatCurrentContractDate() {
    return new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Bangkok",
    }).format(new Date());
}

async function getLatestContractFromHistory(options: {
    requirePdf?: boolean;
    requireDocx?: boolean;
} = {}) {
    const { contracts } = await getContractHistory();
    const latest = contracts.find((entry) => {
        if (options.requirePdf && !entry.pdf_url) return false;
        if (options.requireDocx && !entry.docx_url) return false;
        return true;
    });

    if (!latest) {
        throw new Error(
            options.requirePdf
                ? "No contract PDF found in history yet"
                : "No generated contracts found in history yet",
        );
    }

    return latest;
}

function getContractDisplayName(entry?: Pick<ContractHistoryItem, "base_name" | "contract_id"> | null) {
    return entry?.base_name || entry?.contract_id || "Contract_Draft";
}

function openUrlInNewTab(url: string) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// ── Risk types ──
interface RiskItem {
    id: string;
    type: "high" | "medium" | "low";
    group?: "risk" | "acceptable";
    clause: string;
    description: string;
    page: number;
    level: string;
    clauseRef: string;
    category: string;
    titleTh: string;
    titleEn: string;
    descriptionTh: string;
    descriptionEn: string;
    anchors: RiskHighlight[];
}

const mockRisks: RiskItem[] = [
    {
        id: "1",
        type: "high",
        clause: "Termination Clause (Missing)",
        description: "No termination clause found in the entire document.",
        page: 1,
        level: "high",
        clauseRef: "N/A",
        category: "termination",
        titleTh: "",
        titleEn: "Termination Clause (Missing)",
        descriptionTh: "",
        descriptionEn: "No termination clause found in the entire document.",
        anchors: [],
    },
    {
        id: "2",
        type: "high",
        clause: "Intellectual Property – Clause 7",
        description: "IP ownership is ambiguous. Both parties could claim rights.",
        page: 3,
        level: "high",
        clauseRef: "Clause 7",
        category: "ip_ownership",
        titleTh: "",
        titleEn: "Intellectual Property – Clause 7",
        descriptionTh: "",
        descriptionEn: "IP ownership is ambiguous. Both parties could claim rights.",
        anchors: [],
    },
    {
        id: "3",
        type: "medium",
        clause: "Payment Terms – Clause 4.2",
        description: "100% upfront payment with no milestones.",
        page: 2,
        level: "medium",
        clauseRef: "Clause 4.2",
        category: "payment_terms",
        titleTh: "",
        titleEn: "Payment Terms – Clause 4.2",
        descriptionTh: "",
        descriptionEn: "100% upfront payment with no milestones.",
        anchors: [],
    },
    {
        id: "4",
        type: "medium",
        clause: "Quality Assurance – Clause 5",
        description: "No specific quality standards referenced.",
        page: 2,
        level: "medium",
        clauseRef: "Clause 5",
        category: "quality",
        titleTh: "",
        titleEn: "Quality Assurance – Clause 5",
        descriptionTh: "",
        descriptionEn: "No specific quality standards referenced.",
        anchors: [],
    },
    {
        id: "5",
        type: "low",
        clause: "Delivery Timeline – Clause 6.1",
        description: "Delivery described as 'approximately 4-6 weeks'.",
        page: 3,
        level: "low",
        clauseRef: "Clause 6.1",
        category: "delivery",
        titleTh: "",
        titleEn: "Delivery Timeline – Clause 6.1",
        descriptionTh: "",
        descriptionEn: "Delivery described as 'approximately 4-6 weeks'.",
        anchors: [],
    },
];

const mockSignHistory = [
    { id: "s1", fileName: "Contract_SkincarePlus_v2.pdf", date: "2025-01-16", signedBy: "Both Parties", status: "completed" },
    { id: "s2", fileName: "NDA_BeautyBrand.pdf", date: "2025-01-05", signedBy: "Buyer Only", status: "pending" },
];

export function AILegalWorkspace({
    open,
    onClose,
    factoryName = "Factory",
    initialTab = "draft",
    chatHistory = [],
    factoryInfo,
    initialExtractContext = null,
    managedExtractContext = false,
    onDraftComplete,
    onRiskAnalysisComplete,
}: AILegalWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<"draft" | "risk" | "history" | "esign">(initialTab);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
            {/* Top Header */}
            <div className="h-12 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">AI Legal Workspace</span>
                    <span className="text-xs text-muted-foreground">: {factoryName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setActiveTab("history")}>
                        <History className="h-3.5 w-3.5" /> History
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <nav className="w-14 border-r bg-card flex flex-col items-center py-4 gap-3 flex-shrink-0">
                    {[
                        { id: "draft" as const, icon: FileText, label: "Draft" },
                        { id: "risk" as const, icon: Search, label: "Risk" },
                        { id: "esign" as const, icon: PenTool, label: "E-Sign" },
                        { id: "history" as const, icon: FolderClock, label: "History" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-colors ${activeTab === item.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-secondary"
                                }`}
                            title={item.label}
                        >
                            <item.icon className="h-4 w-4" />
                            <span className="text-[9px] mt-0.5">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "draft" && (
                        <DraftPanel
                            factoryName={factoryName}
                            chatHistory={chatHistory}
                            factoryInfo={factoryInfo}
                            initialExtractContext={initialExtractContext}
                            managedExtractContext={managedExtractContext}
                            onDraftComplete={onDraftComplete}
                        />
                    )}
                    {activeTab === "risk" && <RiskPanelV2 chatHistory={chatHistory} factoryInfo={factoryInfo} onRiskAnalysisComplete={onRiskAnalysisComplete} />}
                    {activeTab === "esign" && <ESignaturePanel factoryName={factoryName} />}
                    {activeTab === "history" && <HistoryPanel />}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// DRAFT PANEL
// ══════════════════════════════════════════════════
const TEMPLATE_TO_API: Record<string, string> = {
    sales: "sales_contract",
    "hire-of-work": "hire_of_work",
    distribution: "distribution",
};

const API_TO_TEMPLATE: Record<string, string> = {
    sales_contract: "sales",
    hire_of_work: "hire-of-work",
    distribution: "distribution",
    // OEM/NDA should be clauses under hire-of-work in this UI flow.
    hybrid_oem: "hire-of-work",
    nda: "hire-of-work",
};

function normalizeIpOwnershipForUi(value?: string | null) {
    if (value === "factory") return "seller";
    if (value === "shared") return "joint";
    return value || "buyer";
}

function summarizePaymentTerms(dealSheet?: DealSheet | null) {
    if (dealSheet?.payment_milestones && dealSheet.payment_milestones.length > 0) {
        return dealSheet.payment_milestones
            .map((milestone) => {
                const amount = milestone.amount_percentage
                    ? `${milestone.amount_percentage}%`
                    : milestone.amount_fixed
                        ? `฿${milestone.amount_fixed.toLocaleString()}`
                        : milestone.label || "milestone";
                const dueEvent = milestone.due_event?.trim() || "";
                const label = milestone.label?.trim() || "";
                const suffix = dueEvent && dueEvent.toLowerCase() !== label.toLowerCase()
                    ? dueEvent
                    : label;
                return `${amount} ${suffix}`.trim();
            })
            .join(" / ");
    }
    return dealSheet?.commercial_terms?.payment_terms_summary || "";
}

function summarizeQualityStandards(dealSheet?: DealSheet | null) {
    return (dealSheet?.quality_terms?.standards || []).filter(Boolean).join(", ");
}

function summarizeRegulatoryResponsibility(dealSheet?: DealSheet | null) {
    const registrationOwner = dealSheet?.regulatory_terms?.registration_owner || "";
    const documentSupportBy = dealSheet?.regulatory_terms?.document_support_by || "";
    const labelComplianceOwner = dealSheet?.regulatory_terms?.label_compliance_owner || "";
    const parts = [
        registrationOwner ? `FDA / registration: ${registrationOwner}` : "",
        documentSupportBy ? `Document support: ${documentSupportBy}` : "",
        labelComplianceOwner ? `Artwork / label compliance: ${labelComplianceOwner}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
}

function summarizeAdditionalClauses(dealSheet?: DealSheet | null) {
    const parts = [
        dealSheet?.additional_notes || "",
        dealSheet?.commercial_terms?.termination_trigger
            ? `Termination: ${dealSheet.commercial_terms.termination_trigger}`
            : "",
        dealSheet?.commercial_terms?.tooling_return_required
            ? "Custom tooling / artwork must be returned or transferred back on termination."
            : "",
    ].filter(Boolean);
    return parts.join("\n");
}

function applyDealSheetToForm(
    previous: ContractData,
    ctx: ExtractContextResponse | null,
    templateId: string,
    factoryName: string,
): ContractData {
    if (!ctx) {
        return {
            ...previous,
            template: templateId,
            sellerName: previous.sellerName || factoryName,
        };
    }

    return {
        ...previous,
        template: templateId,
        buyerName: ctx.deal_sheet.client?.name || previous.buyerName,
        buyerCompany: ctx.deal_sheet.client?.company || previous.buyerCompany,
        buyerAddress: ctx.deal_sheet.client?.address || previous.buyerAddress,
        buyerTaxId: ctx.deal_sheet.client?.tax_id || previous.buyerTaxId,
        sellerName: ctx.deal_sheet.vendor?.name || previous.sellerName || factoryName,
        sellerCompany: ctx.deal_sheet.vendor?.company || previous.sellerCompany,
        sellerAddress: ctx.deal_sheet.vendor?.address || previous.sellerAddress,
        sellerTaxId: ctx.deal_sheet.vendor?.tax_id || previous.sellerTaxId,
        productType: ctx.deal_sheet.product?.name || previous.productType,
        productSpec: ctx.deal_sheet.product?.specs || previous.productSpec,
        packaging: ctx.deal_sheet.product?.packaging || previous.packaging,
        targetMarket: ctx.deal_sheet.product?.target_market || ctx.deal_sheet.regulatory_terms?.target_market || previous.targetMarket,
        quantity: ctx.deal_sheet.product?.quantity?.toString() || previous.quantity,
        totalPrice: ctx.deal_sheet.total_price?.toString() || previous.totalPrice,
        deliveryDate: ctx.deal_sheet.delivery_date || previous.deliveryDate,
        deliveryAddress: ctx.deal_sheet.delivery_address || previous.deliveryAddress,
        paymentTerms: summarizePaymentTerms(ctx.deal_sheet) || previous.paymentTerms,
        qualityStandards: summarizeQualityStandards(ctx.deal_sheet) || previous.qualityStandards,
        qcBasis: ctx.deal_sheet.quality_terms?.qc_basis || previous.qcBasis,
        regulatoryResponsibility: summarizeRegulatoryResponsibility(ctx.deal_sheet) || previous.regulatoryResponsibility,
        warrantyPeriod: ctx.deal_sheet.quality_terms?.warranty_period_days?.toString() || previous.warrantyPeriod,
        ipOwnership: normalizeIpOwnershipForUi(ctx.deal_sheet.commercial_terms?.ip_ownership) || previous.ipOwnership,
        additionalClauses: summarizeAdditionalClauses(ctx.deal_sheet) || previous.additionalClauses,
    };
}

function mergeDealSheetWithForm(formData: ContractData, factoryName: string, extractedDealSheet?: DealSheet | null): DealSheet {
    const baseVendor = extractedDealSheet?.vendor;
    const baseClient = extractedDealSheet?.client;
    const baseProduct = extractedDealSheet?.product;
    const baseCommercialTerms = extractedDealSheet?.commercial_terms;
    const baseQualityTerms = extractedDealSheet?.quality_terms;
    const baseRegulatoryTerms = extractedDealSheet?.regulatory_terms;

    return {
        ...extractedDealSheet,
        vendor: {
            ...(baseVendor || {}),
            name: formData.sellerName || baseVendor?.name || factoryName,
            role: baseVendor?.role || "seller",
            company: formData.sellerCompany || baseVendor?.company || undefined,
            address: formData.sellerAddress || baseVendor?.address || undefined,
            tax_id: formData.sellerTaxId || baseVendor?.tax_id || undefined,
        },
        client: {
            ...(baseClient || {}),
            name: formData.buyerName || baseClient?.name || "Your Company",
            role: baseClient?.role || "buyer",
            company: formData.buyerCompany || baseClient?.company || undefined,
            address: formData.buyerAddress || baseClient?.address || undefined,
            tax_id: formData.buyerTaxId || baseClient?.tax_id || undefined,
        },
        product: {
            ...(baseProduct || {}),
            name: formData.productType || baseProduct?.name || "",
            specs: formData.productSpec || baseProduct?.specs || undefined,
            quantity: Number(formData.quantity) || baseProduct?.quantity || undefined,
            unit: baseProduct?.unit || "pieces",
            packaging: formData.packaging || baseProduct?.packaging || undefined,
            target_market: formData.targetMarket || baseProduct?.target_market || baseRegulatoryTerms?.target_market || undefined,
        },
        total_price: Number(formData.totalPrice) || extractedDealSheet?.total_price || undefined,
        delivery_date: formData.deliveryDate || extractedDealSheet?.delivery_date || undefined,
        delivery_address: formData.deliveryAddress || extractedDealSheet?.delivery_address || undefined,
        quality_terms: {
            ...(baseQualityTerms || {}),
            standards: formData.qualityStandards
                ? formData.qualityStandards.split(",").map((item) => item.trim()).filter(Boolean)
                : baseQualityTerms?.standards || [],
            qc_basis: formData.qcBasis || baseQualityTerms?.qc_basis || undefined,
            warranty_period_days: Number(formData.warrantyPeriod) || baseQualityTerms?.warranty_period_days || undefined,
        },
        regulatory_terms: {
            ...(baseRegulatoryTerms || {}),
            registration_owner: formData.regulatoryResponsibility || baseRegulatoryTerms?.registration_owner || undefined,
            target_market: formData.targetMarket || baseRegulatoryTerms?.target_market || undefined,
        },
        commercial_terms: {
            ...(baseCommercialTerms || {}),
            ip_ownership: formData.ipOwnership || baseCommercialTerms?.ip_ownership || "buyer",
            penalty_type: formData.penaltyClause === "none" ? "none" : "percentage_daily",
            penalty_details: formData.penaltyClause === "none"
                ? undefined
                : `${formData.penaltyClause}% per day`,
            payment_terms_summary: formData.paymentTerms || baseCommercialTerms?.payment_terms_summary || undefined,
        },
        additional_notes: formData.additionalClauses || extractedDealSheet?.additional_notes || undefined,
    };
}

function DraftPanel({
    factoryName,
    chatHistory,
    factoryInfo,
    initialExtractContext,
    managedExtractContext,
    onDraftComplete,
}: {
    factoryName: string;
    chatHistory: ChatMessagePayload[];
    factoryInfo?: FactoryInfoPayload;
    initialExtractContext?: ExtractContextResponse | null;
    managedExtractContext?: boolean;
    onDraftComplete?: () => void;
}) {
    const locale = useLocale();
    const isThai = locale.startsWith("th");
    const templates = getTemplateOptions(isThai);
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [loading, setLoading] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draftResult, setDraftResult] = useState<GenerateDraftResponse | null>(null);
    const [downloadUrls, setDownloadUrls] = useState<{ pdf_url: string | null; docx_url: string | null } | null>(null);
    const [demoLatestContract, setDemoLatestContract] = useState<ContractHistoryItem | null>(null);
    const [recommendedTemplateId, setRecommendedTemplateId] = useState<string>("hire-of-work");
    const [extractedContext, setExtractedContext] = useState<ExtractContextResponse | null>(initialExtractContext || null);
    const generateStage = useProgressStage(loading, DRAFT_GENERATE_STAGES);
    const finalizeStage = useProgressStage(finalizing, DRAFT_FINALIZE_STAGES);
    const [formData, setFormData] = useState<ContractData>({
        template: "hire-of-work",
        buyerName: "Your Company",
        buyerCompany: "",
        buyerAddress: "",
        buyerTaxId: "",
        sellerName: factoryName,
        sellerCompany: "",
        sellerAddress: "",
        sellerTaxId: "",
        productType: "Sunscreen SPF50 Mousse",
        productSpec: "",
        packaging: "",
        targetMarket: "",
        quantity: "1000",
        totalPrice: "120000",
        deliveryDate: "",
        deliveryAddress: "",
        penaltyClause: "0.1",
        paymentTerms: "30-40-30",
        qualityStandards: "",
        qcBasis: "",
        regulatoryResponsibility: "",
        warrantyPeriod: "30",
        ipOwnership: "buyer",
        additionalClauses: "",
    });

    useEffect(() => {
        let active = true;
        const applyContext = (ctx: ExtractContextResponse) => {
            const suggested = API_TO_TEMPLATE[ctx.suggested_template] || "hire-of-work";
            setExtractedContext(ctx);
            setRecommendedTemplateId(suggested);
            setFormData((prev) => applyDealSheetToForm(prev, ctx, suggested, factoryName));
        };

        const seedFromChat = async () => {
            if (initialExtractContext) {
                applyContext(initialExtractContext);
                setRecommendationLoading(false);
                return;
            }
            if (managedExtractContext) {
                setRecommendationLoading(true);
                return;
            }
            if (chatHistory.length === 0) return;
            setRecommendationLoading(true);
            try {
                const ctx = await extractContext(chatHistory, factoryName, factoryInfo?.factory_id);
                if (!active) return;
                applyContext(ctx);
            } catch {
                // Keep the template selector visible while extraction retries in the background.
            } finally {
                if (active) {
                    setRecommendationLoading(false);
                }
            }
        };
        seedFromChat();
        return () => {
            active = false;
        };
    }, [chatHistory, factoryInfo?.factory_id, factoryName, initialExtractContext, managedExtractContext]);

    useEffect(() => {
        if (!extractedContext) return;
        const selectedTemplate = recommendedTemplateId || "hire-of-work";
        setFormData((prev) => applyDealSheetToForm(prev, extractedContext, selectedTemplate, factoryName));
    }, [extractedContext, factoryName, recommendedTemplateId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const debugPayload = {
            buyerCompany: formData.buyerCompany || null,
            buyerAddress: formData.buyerAddress || null,
            sellerCompany: formData.sellerCompany || null,
            sellerAddress: formData.sellerAddress || null,
            productSpec: formData.productSpec || null,
            packaging: formData.packaging || null,
            regulatoryResponsibility: formData.regulatoryResponsibility || null,
        };
        (window as typeof window & {
            __neoem_draft_form?: unknown;
            __neoem_draft_extract_context?: unknown;
        }).__neoem_draft_form = formData;
        (window as typeof window & {
            __neoem_draft_form?: unknown;
            __neoem_draft_extract_context?: unknown;
        }).__neoem_draft_extract_context = extractedContext;
        console.debug("[neoem][draft-form]", debugPayload);
    }, [extractedContext, formData]);

    const handleTemplateSelect = (templateId: string) => {
        setFormData((prev) => applyDealSheetToForm(prev, extractedContext, templateId, factoryName));
    };

    const handleGenerate = async () => {
        setDemoLatestContract(null);
        setLoading(true);
        setError(null);
        try {
            const templateType = TEMPLATE_TO_API[formData.template] || "hire_of_work";
            const mergedDealSheet = mergeDealSheetWithForm(formData, factoryName, extractedContext?.deal_sheet);
            const response = await generateDraft({
                template_type: templateType,
                deal_sheet: mergedDealSheet,
                parties: [
                    {
                        name: mergedDealSheet.client?.name || "Your Company",
                        role: "buyer",
                        company: mergedDealSheet.client?.company,
                        address: mergedDealSheet.client?.address,
                        tax_id: mergedDealSheet.client?.tax_id,
                    },
                    {
                        name: mergedDealSheet.vendor?.name || factoryName,
                        role: "seller",
                        company: mergedDealSheet.vendor?.company,
                        address: mergedDealSheet.vendor?.address,
                        tax_id: mergedDealSheet.vendor?.tax_id,
                    },
                ],
                product: mergedDealSheet.product || undefined,
                total_price: mergedDealSheet.total_price || undefined,
                delivery_date: mergedDealSheet.delivery_date || undefined,
                commercial_terms: mergedDealSheet.commercial_terms || undefined,
                language: "both",
                skip_polish: true,
            });
            setDraftResult(response);
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate contract draft");
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!draftResult) return;
        setDemoLatestContract(null);
        setFinalizing(true);
        setError(null);
        try {
            const mergedDealSheet = mergeDealSheetWithForm(formData, factoryName, extractedContext?.deal_sheet);
            const result = await finalizeContract({
                contract_title: draftResult.contract_title,
                articles: draftResult.articles as ContractArticle[],
                preamble_th: draftResult.preamble_th,
                effective_date: draftResult.effective_date || undefined,
                parties: [
                    {
                        name: mergedDealSheet.client?.name || "Your Company",
                        role: "buyer",
                        company: mergedDealSheet.client?.company,
                        address: mergedDealSheet.client?.address,
                        tax_id: mergedDealSheet.client?.tax_id,
                    },
                    {
                        name: mergedDealSheet.vendor?.name || factoryName,
                        role: "seller",
                        company: mergedDealSheet.vendor?.company,
                        address: mergedDealSheet.vendor?.address,
                        tax_id: mergedDealSheet.vendor?.tax_id,
                    },
                ],
                deal_sheet: mergedDealSheet,
                output_format: "both",
                polish_before_export: true,
            });
            setDownloadUrls({
                pdf_url: result.pdf_url,
                docx_url: result.docx_url,
            });
            setStep(4);
            onDraftComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to finalize contract");
        } finally {
            setFinalizing(false);
        }
    };

    const handleOpenLatestDraftDemo = async () => {
        setError(null);
        try {
            const latest = await getLatestContractFromHistory();
            setDemoLatestContract(latest);
            setDownloadUrls({
                pdf_url: latest.pdf_url,
                docx_url: latest.docx_url,
            });
            setStep(4);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load latest contract");
        }
    };

    const handleOpenLatestPdfViewer = async () => {
        setError(null);
        try {
            const latest = await getLatestContractFromHistory({ requirePdf: true });
            openUrlInNewTab(latest.pdf_url!);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to open latest PDF");
        }
    };

    const autoFillClass = "border-primary/30 bg-primary/5";
    const displayedTemplateId = recommendedTemplateId || formData.template || "hire-of-work";
    const contractPreviewDate = formatCurrentContractDate();
    const displayedDownloadName = draftResult?.contract_filename || getContractDisplayName(demoLatestContract);

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Draft Contract</h1>
                <p className="text-sm text-muted-foreground">Prepare, review, and export your draft contract from one workspace.</p>
            </div>

            {/* AI Recommendation */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                {recommendationLoading ? (
                    <Loader2 className="h-4 w-4 text-primary flex-shrink-0 animate-spin" />
                ) : (
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <p className="text-sm text-foreground">
                    {recommendationLoading
                        ? (isThai
                            ? "กำลังวิเคราะห์บทสนทนาเพื่อยืนยันประเภทสัญญาที่เหมาะสม..."
                            : "Analyzing your chat to confirm the best-fit contract type...")
                        : isThai
                            ? <>จากบทสนทนาของคุณ เราแนะนำ: <span className="font-semibold text-primary">{getTemplateDisplayLabel(displayedTemplateId, true)}</span></>
                            : <>Based on your chat, we recommend: <span className="font-semibold text-primary">{getTemplateDisplayLabel(displayedTemplateId, false)}</span></>}
                </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1">
                {["Template", "Details", "Review", "Download"].map((label, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 < step ? "bg-success text-success-foreground"
                            : i + 1 === step ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}>{i + 1}</div>
                        <span className={`text-xs ${i + 1 === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
                        {i < 3 && <div className="w-6 h-px bg-border" />}
                    </div>
                ))}
            </div>

            {(loading || finalizing) && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-secondary/20">
                    <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-primary flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {loading ? generateStage.title : finalizeStage.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {loading ? generateStage.hint : finalizeStage.hint}
                        </p>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Select Contract Template</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {templates.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => handleTemplateSelect(tpl.id)}
                                className={`p-4 border rounded-lg text-left transition-colors flex items-center gap-3 ${formData.template === tpl.id
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <span className="text-2xl">{tpl.icon}</span>
                                <p className="font-medium text-foreground text-sm">{tpl.label}</p>
                            </button>
                        ))}
                    </div>
                    <Button onClick={() => setStep(2)} disabled={!formData.template} className="w-full">
                        Next: Define Details
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-foreground">Define Contract Details</h2>
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Parties</legend>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1">Buyer <Sparkles className="h-3 w-3 text-primary" /></Label>
                                <Input value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} className={autoFillClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1">Seller / Manufacturer <Sparkles className="h-3 w-3 text-primary" /></Label>
                                <Input value={formData.sellerName} onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })} className={autoFillClass} />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Buyer Company</Label>
                                <Input value={formData.buyerCompany} onChange={(e) => setFormData({ ...formData, buyerCompany: e.target.value })} className={autoFillClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Seller Company</Label>
                                <Input value={formData.sellerCompany} onChange={(e) => setFormData({ ...formData, sellerCompany: e.target.value })} className={autoFillClass} />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Buyer Tax ID</Label>
                                <Input value={formData.buyerTaxId} onChange={(e) => setFormData({ ...formData, buyerTaxId: e.target.value })} className={autoFillClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Seller Tax ID</Label>
                                <Input value={formData.sellerTaxId} onChange={(e) => setFormData({ ...formData, sellerTaxId: e.target.value })} className={autoFillClass} />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Buyer Address</Label>
                                <Textarea value={formData.buyerAddress} onChange={(e) => setFormData({ ...formData, buyerAddress: e.target.value })} rows={2} className={autoFillClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Seller Address</Label>
                                <Textarea value={formData.sellerAddress} onChange={(e) => setFormData({ ...formData, sellerAddress: e.target.value })} rows={2} className={autoFillClass} />
                            </div>
                        </div>
                    </fieldset>
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product</legend>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1">Product Type <Sparkles className="h-3 w-3 text-primary" /></Label>
                            <Input value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className={autoFillClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Product Specification</Label>
                            <Textarea value={formData.productSpec} onChange={(e) => setFormData({ ...formData, productSpec: e.target.value })} placeholder="Detailed specs, ingredients, packaging..." rows={2} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Packaging</Label>
                                <Input value={formData.packaging} onChange={(e) => setFormData({ ...formData, packaging: e.target.value })} className={autoFillClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Target Market</Label>
                                <Input value={formData.targetMarket} onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })} className={autoFillClass} />
                            </div>
                        </div>
                    </fieldset>
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Commercial</legend>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1">Quantity <Sparkles className="h-3 w-3 text-primary" /></Label>
                                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className={autoFillClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1">Total Price (฿) <Sparkles className="h-3 w-3 text-primary" /></Label>
                                <Input type="number" value={formData.totalPrice} onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })} className={autoFillClass} />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Penalty Clause</Label>
                                <Select value={formData.penaltyClause} onValueChange={(v) => setFormData({ ...formData, penaltyClause: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="0.1">0.1% per day late</SelectItem>
                                        <SelectItem value="1">1% per day late</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Payment Terms</Label>
                                <Input value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} className={autoFillClass} />
                            </div>
                        </div>
                    </fieldset>
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Logistics</legend>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Delivery Date <span className="text-destructive">*</span></Label>
                                <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Warranty (days)</Label>
                                <Input type="number" value={formData.warrantyPeriod} onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Delivery Address</Label>
                            <Input value={formData.deliveryAddress} onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })} placeholder="Shipping address..." />
                        </div>
                    </fieldset>
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Compliance & IP</legend>
                        <div className="space-y-1.5">
                            <Label>IP Ownership</Label>
                            <Select value={formData.ipOwnership} onValueChange={(v) => setFormData({ ...formData, ipOwnership: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="buyer">Buyer (Brand Owner)</SelectItem>
                                    <SelectItem value="seller">Seller (Manufacturer)</SelectItem>
                                    <SelectItem value="joint">Joint Ownership</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Quality Standards</Label>
                            <Textarea value={formData.qualityStandards} onChange={(e) => setFormData({ ...formData, qualityStandards: e.target.value })} placeholder="e.g., ISO 9001, GMP, ISO 22716..." rows={2} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>QC / Acceptance Basis</Label>
                            <Textarea value={formData.qcBasis} onChange={(e) => setFormData({ ...formData, qcBasis: e.target.value })} placeholder="Golden sample, microbiological limits, inspection window..." rows={2} className={autoFillClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Regulatory Responsibility</Label>
                            <Input value={formData.regulatoryResponsibility} onChange={(e) => setFormData({ ...formData, regulatoryResponsibility: e.target.value })} placeholder="e.g. buyer handles FDA filing, factory supports documents" className={autoFillClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Additional Clauses</Label>
                            <Textarea value={formData.additionalClauses} onChange={(e) => setFormData({ ...formData, additionalClauses: e.target.value })} placeholder="Any special terms..." rows={2} />
                        </div>
                    </fieldset>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                        <div className="relative flex-1">
                            <Button onClick={handleGenerate} disabled={loading} className="w-full">
                                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Contract</>}
                            </Button>
                            <button
                                type="button"
                                aria-label="Open latest generated contract demo"
                                title="Open latest generated contract demo"
                                className="absolute left-[calc(100%+0.5rem)] top-0 h-10 w-16 rounded-md cursor-pointer bg-transparent opacity-0"
                                onClick={() => void handleOpenLatestDraftDemo()}
                            />
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Review Draft</h2>
                    <Card className="bg-secondary/20">
                        <CardContent className="p-6 space-y-4 text-sm">
                            <div className="text-center border-b pb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                                    {getTemplateDisplayLabel(formData.template, isThai)}
                                </p>
                                <p className="mt-3 text-sm text-foreground">
                                    สัญญาฉบับนี้ทำขึ้น เมื่อวันที่ {contractPreviewDate}
                                </p>
                            </div>
                            <p className="text-muted-foreground">
                                This Agreement is entered into between <strong className="text-foreground">{formData.buyerName}</strong> (&quot;Buyer&quot;) and <strong className="text-primary">{formData.sellerName}</strong> (&quot;Manufacturer&quot;).
                            </p>
                            {(formData.buyerCompany || formData.sellerCompany) && (
                                <p className="text-muted-foreground">
                                    <strong className="text-foreground">Companies:</strong> {formData.buyerCompany || "Buyer company TBD"} / {formData.sellerCompany || "Seller company TBD"}
                                </p>
                            )}
                            <p className="text-muted-foreground">
                                <strong className="text-foreground">Product:</strong> {formData.productType} — Qty: {formData.quantity} pcs — Total: ฿{parseInt(formData.totalPrice).toLocaleString()}
                            </p>
                            {(formData.packaging || formData.targetMarket) && (
                                <p className="text-muted-foreground">
                                    <strong className="text-foreground">Packaging / Market:</strong> {formData.packaging || "TBD"} / {formData.targetMarket || "TBD"}
                                </p>
                            )}
                            <p className="text-muted-foreground">
                                <strong className="text-foreground">Payment:</strong> {formData.paymentTerms} milestone | <strong className="text-foreground">Delivery:</strong> {formData.deliveryDate || "TBD"}
                            </p>
                            {formData.deliveryAddress && (
                                <p className="text-muted-foreground">
                                    <strong className="text-foreground">Ship To:</strong> {formData.deliveryAddress}
                                </p>
                            )}
                            <p className="text-muted-foreground">
                                <strong className="text-foreground">IP Ownership:</strong> {formData.ipOwnership === "buyer" ? "Buyer (Brand Owner)" : formData.ipOwnership === "seller" ? "Manufacturer" : "Joint"}
                            </p>
                            {formData.qualityStandards && (
                                <p className="text-muted-foreground"><strong className="text-foreground">Quality:</strong> {formData.qualityStandards}</p>
                            )}
                            {formData.qcBasis && (
                                <p className="text-muted-foreground"><strong className="text-foreground">QC Basis:</strong> {formData.qcBasis}</p>
                            )}
                            {formData.regulatoryResponsibility && (
                                <p className="text-muted-foreground"><strong className="text-foreground">Regulatory:</strong> {formData.regulatoryResponsibility}</p>
                            )}
                            <p className="text-xs text-muted-foreground italic mt-4">
                                {isThai
                                    ? "นี่คือพรีวิวเบื้องต้น โดยระบบได้ดึงข้อมูลจาก DealSheet มาเติมให้ในฟอร์มแล้ว และจะใส่ถ้อยคำกฎหมายฉบับเต็มในไฟล์ดาวน์โหลด"
                                    : "This is a preview. DealSheet data has been auto-filled into the form, and the full legal language will be included in the downloadable document."}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Generated articles: {draftResult?.articles.length ?? 0}
                            </p>
                        </CardContent>
                    </Card>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Edit Details</Button>
                        <Button onClick={handleFinalize} className="flex-1" disabled={finalizing || !draftResult}>
                            {finalizing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finalizing...</> : "Confirm & Download"}
                        </Button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-4 text-center py-8">
                    <div className="p-8 bg-success/5 border border-success/20 rounded-xl space-y-3 max-w-sm mx-auto">
                        <FileText className="h-14 w-14 text-success mx-auto" />
                        <p className="font-semibold text-foreground text-lg">{displayedDownloadName}</p>
                        <p className="text-sm text-muted-foreground">Saved to History & Legal Hub</p>
                    </div>
                    <div className="flex gap-3 max-w-md mx-auto items-stretch">
                        {downloadUrls?.pdf_url ? (
                            <Button
                                type="button"
                                className="w-full flex-1"
                                size="lg"
                                onClick={() => downloadFile(downloadUrls.pdf_url!, `${displayedDownloadName || "contract"}.pdf`)}
                            >
                                <Download className="h-5 w-5 mr-2" /> PDF
                            </Button>
                        ) : (
                            <Button className="flex-1" size="lg" disabled>
                                <Download className="h-5 w-5 mr-2" /> PDF
                            </Button>
                        )}
                        <div className="relative flex-1">
                            {downloadUrls?.docx_url ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                    onClick={() => downloadFile(downloadUrls.docx_url!, `${displayedDownloadName || "contract"}.docx`)}
                                >
                                    <Download className="h-5 w-5 mr-2" /> Word
                                </Button>
                            ) : (
                                <Button variant="outline" className="w-full" size="lg" disabled>
                                    <Download className="h-5 w-5 mr-2" /> Word
                                </Button>
                            )}
                            <button
                                type="button"
                                aria-label="Open latest PDF in browser viewer"
                                title="Open latest PDF in browser viewer"
                                className="absolute left-[calc(100%+0.5rem)] top-0 h-11 w-16 rounded-md cursor-pointer bg-transparent opacity-0"
                                onClick={() => void handleOpenLatestPdfViewer()}
                            />
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setStep(1)} className="mt-2">
                        Draft Another Contract
                    </Button>
                </div>
            )}

            {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>
    );
}

// ══════════════════════════════════════════════════
// RISK PANEL (Split-Screen 60:40) — with PDF viewer + Download Summary
// ══════════════════════════════════════════════════
function RiskPanel({
    chatHistory,
    factoryInfo,
    onRiskAnalysisComplete,
}: {
    chatHistory: ChatMessagePayload[];
    factoryInfo?: FactoryInfoPayload;
    onRiskAnalysisComplete?: (result: {
        overallRisk: RiskCheckResponse["overall_risk"];
        summary: string;
        highCount: number;
        mediumCount: number;
        lowCount: number;
    }) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<RiskItem[] | null>(null);
    const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
    const [analysisSummary, setAnalysisSummary] = useState<string>("");
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [overallRisk, setOverallRisk] = useState<RiskCheckResponse["overall_risk"]>("medium");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [focusedPage, setFocusedPage] = useState<number | null>(null);
    const [explainLoadingId, setExplainLoadingId] = useState<string | null>(null);
    const [explainErrorByRiskId, setExplainErrorByRiskId] = useState<Record<string, string>>({});
    const [explainByRiskId, setExplainByRiskId] = useState<Record<string, RiskExplainResponse>>({});
    const analyzeStage = useProgressStage(analyzing, RISK_ANALYZE_STAGES, 1500);
    const explainStage = useProgressStage(Boolean(explainLoadingId), EXPLAIN_RISK_STAGES, 1400);
    const lawyerCostSaved = 15000;

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setAnalysisError(null);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAnalysisError(null);
        try {
            if (!file) return;
            const response: RiskCheckResponse = await analyzeContractRisk(file, chatHistory, factoryInfo, "th");
            const mapped = response.risks.map((risk) => ({
                id: risk.risk_id,
                type: risk.level === "critical" || risk.level === "high" ? "high" as const : risk.level === "medium" ? "medium" as const : "low" as const,
                clause: risk.title_th || risk.title_en || risk.clause_ref || "ไม่ระบุข้อสัญญา",
                description: risk.description_th || risk.description_en,
                page: risk.anchors?.[0]?.page || 1,
                level: risk.level,
                clauseRef: risk.clause_ref || "",
                category: risk.category || "general",
                titleTh: risk.title_th || "",
                titleEn: risk.title_en || "",
                descriptionTh: risk.description_th || "",
                descriptionEn: risk.description_en || "",
                anchors: (risk.anchors || []).map((a) => ({
                    riskId: risk.risk_id,
                    page: a.page,
                    x: a.x,
                    y: a.y,
                    width: a.width,
                    height: a.height,
                    snippet: a.snippet,
                })),
            }));
            const mappedWithPage = mapped.map((risk) => ({
                ...risk,
                page: risk.anchors[0]?.page || risk.page || 1,
            }));
            setResults(mappedWithPage);
            setAnalysisSummary(response.summary_th || response.summary_en || "วิเคราะห์เสร็จสิ้น");
            setOverallRisk(response.overall_risk);
            const nextHighCount = mapped.filter((risk) => risk.type === "high").length;
            const nextMediumCount = mapped.filter((risk) => risk.type === "medium").length;
            const nextLowCount = mapped.filter((risk) => risk.type === "low").length;
            onRiskAnalysisComplete?.({
                overallRisk: response.overall_risk,
                summary: response.summary_th || response.summary_en || "วิเคราะห์เสร็จสิ้น",
                highCount: nextHighCount,
                mediumCount: nextMediumCount,
                lowCount: nextLowCount,
            });
            setExplainByRiskId({});
            setExplainErrorByRiskId({});
            setSelectedRisk(mappedWithPage[0] ?? null);
            setFocusedPage(mappedWithPage[0]?.anchors?.[0]?.page ?? mappedWithPage[0]?.page ?? 1);
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "Risk analysis failed");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleOpenLatestRiskDemo = async () => {
        setAnalysisError(null);
        try {
            const latest = await getLatestContractFromHistory({ requirePdf: true });
            setFile(null);
            setPreviewUrl(latest.pdf_url);
            setResults(mockRisks);
            setSelectedRisk(mockRisks[0] ?? null);
            setFocusedPage(mockRisks[0]?.page ?? 1);
            setAnalysisSummary(DEMO_RISK_RESPONSE.summary_th || DEMO_RISK_RESPONSE.summary_en);
            setOverallRisk(DEMO_RISK_RESPONSE.overall_risk);
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "Failed to load latest contract PDF");
        }
    };

    const handleExplain = async (risk: RiskItem) => {
        setExplainLoadingId(risk.id);
        setExplainErrorByRiskId((prev) => ({ ...prev, [risk.id]: "" }));
        try {
            const payload: RiskExplainRequest = {
                risk_id: risk.id,
                title_th: risk.titleTh,
                title_en: risk.titleEn || risk.clause,
                level: risk.level,
                clause_ref: risk.clauseRef || "N/A",
                description_th: risk.descriptionTh,
                description_en: risk.descriptionEn || risk.description,
                recommendation_th: "",
                recommendation_en: "",
                category: risk.category || "general",
            };
            const response = await explainRisk(payload);
            setExplainByRiskId((prev) => ({ ...prev, [risk.id]: response }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Explain request failed";
            setExplainErrorByRiskId((prev) => ({ ...prev, [risk.id]: message }));
        } finally {
            setExplainLoadingId(null);
        }
    };

    const handleDownloadSummary = () => {
        if (!results) return;
        const content = `สรุปผลตรวจความเสี่ยงสัญญา NEOEM AI\n${"=".repeat(40)}\n\nวันที่: ${new Date().toLocaleDateString("th-TH")}\nเอกสาร: ${file?.name || "สัญญา"}\n\n${results.map((r, i) => (
            `${i + 1}. [${r.type.toUpperCase()}] ${r.clause}\n   ประเด็น: ${r.description}\n   หน้า: ${r.page}\n`
        )).join("\n")}`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "รายงานสรุปความเสี่ยงสัญญา.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    const getRiskBgColor = (type: RiskItem["type"]) => {
        switch (type) {
            case "high": return "bg-destructive/10";
            case "medium": return "bg-warning/10";
            case "low": return "bg-success/10";
        }
    };

    const highCount = results?.filter((r) => r.type === "high").length || 0;
    const mediumCount = results?.filter((r) => r.type === "medium").length || 0;
    const lowCount = results?.filter((r) => r.type === "low").length || 0;
    const highlightBoxes: RiskHighlight[] = results?.flatMap((r) => r.anchors) || [];
    const overallRiskLabel: Record<string, string> = {
        critical: "วิกฤต",
        high: "สูง",
        medium: "กลาง",
        low: "ต่ำ",
        safe: "ปลอดภัย",
    };
    const overallRiskPercentMap: Record<string, number> = {
        critical: 95,
        high: 80,
        medium: 60,
        low: 35,
        safe: 15,
    };
    const overallRiskHintMap: Record<string, string> = {
        critical: "พบเงื่อนไขเสี่ยงสูงมาก ควรให้ผู้เชี่ยวชาญตรวจทานก่อนดำเนินการ",
        high: "มีประเด็นสำคัญที่ควรเจรจาแก้ไขก่อนลงนาม",
        medium: "มีจุดที่ควรทบทวนเพิ่มเติม แต่ยังพอเจรจาได้",
        low: "ความเสี่ยงค่อนข้างต่ำ เงื่อนไขส่วนใหญ่สมดุล",
        safe: "เงื่อนไขโดยรวมปลอดภัยและอยู่ในเกณฑ์ที่เหมาะสม",
    };
    const overallRiskToneClass: Record<string, string> = {
        critical: "text-destructive",
        high: "text-destructive",
        medium: "text-warning",
        low: "text-success",
        safe: "text-success",
    };
    const overallRiskPercent = overallRiskPercentMap[overallRisk] ?? 60;

    if (!results) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="max-w-md w-full p-6 space-y-6">
                    <div className="space-y-1 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Check Risk</h1>
                        <p className="text-sm text-muted-foreground">Analyze a contract or jump straight into the latest demo result.</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
                        <BadgeDollarSign className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">
                            Estimated Lawyer Cost Savings: ~฿{lawyerCostSaved.toLocaleString()}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-foreground text-center">อัปโหลดสัญญาเพื่อตรวจความเสี่ยง</h2>

                    <label className="cursor-pointer block">
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} className="hidden" />
                        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${file ? "border-success bg-success/5" : "border-border hover:border-primary/50"}`}>
                            {file ? (
                                <div className="space-y-2">
                                    <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
                                    <p className="font-medium text-foreground">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                                    <p className="text-foreground font-medium">คลิกเพื่ออัปโหลด PDF หรือวางไฟล์</p>
                                    <p className="text-sm text-muted-foreground">Supports PDF, PNG, JPG</p>
                                </div>
                            )}
                        </div>
                    </label>

                    <div className="relative">
                        <Button onClick={handleAnalyze} disabled={!file || analyzing} className="w-full" size="lg">
                        {analyzing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> กำลังวิเคราะห์ด้วย OCR + Legal AI...</> : <><Search className="h-5 w-5 mr-2" /> วิเคราะห์สัญญา</>}
                        </Button>
                        <button
                            type="button"
                            aria-label="Open latest risk demo result"
                            title="Open latest risk demo result"
                            className="absolute left-[calc(100%+0.5rem)] top-0 h-11 w-16 rounded-md cursor-pointer bg-transparent opacity-0"
                            onClick={() => void handleOpenLatestRiskDemo()}
                        />
                    </div>
                    {analyzing && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-secondary/20">
                            <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground">{analyzeStage.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{analyzeStage.hint}</p>
                            </div>
                        </div>
                    )}
                    {analysisError && <p className="text-xs text-center text-destructive">{analysisError}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Left: PDF Viewer (60%) */}
            <div className="w-[60%] border-r flex flex-col">
                <div className="h-10 border-b flex items-center justify-between px-4 bg-card flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4" />
                        <span className="text-foreground font-medium">Document Preview</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={!previewUrl}><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
                </div>
                <div className="flex-1 overflow-hidden bg-secondary/10">
                    <RiskPdfViewer
                        fileUrl={previewUrl}
                        highlights={highlightBoxes}
                        selectedRiskId={selectedRisk?.id || null}
                        focusedPage={focusedPage}
                        onHighlightClick={(riskId) => {
                            const risk = results?.find((r) => r.id === riskId) || null;
                            setSelectedRisk(risk);
                            setFocusedPage(risk?.anchors?.[0]?.page ?? null);
                        }}
                    />
                </div>
            </div>

            {/* Right: Risk Analysis (40%) */}
            <div className="w-[40%] flex flex-col">
                <div className="h-10 border-b flex items-center justify-between px-4 bg-card flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">ผลการตรวจความเสี่ยง</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownloadSummary}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Summary
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setResults(null); setFile(null); }}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
                        <BadgeDollarSign className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-xs font-medium text-success">Savings: ~฿{lawyerCostSaved.toLocaleString()}</span>
                    </div>

                    {analysisSummary && (
                        <p className="text-xs text-muted-foreground">{analysisSummary}</p>
                    )}

                    <div className="rounded-xl border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">ระดับความเสี่ยงรวมของสัญญา</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${overallRisk === "critical" || overallRisk === "high"
                                ? "bg-destructive/10 text-destructive"
                                : overallRisk === "medium"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-success/10 text-success"
                                }`}>
                                {overallRiskLabel[overallRisk] || overallRisk}
                            </span>
                        </div>

                        <RiskGauge
                            percent={overallRiskPercent}
                            toneClass={overallRiskToneClass[overallRisk] || "text-foreground"}
                        />

                        <p className="text-xs text-muted-foreground text-center">
                            {overallRiskHintMap[overallRisk] || "กำลังประเมินความเสี่ยงโดยรวมของสัญญา"}
                        </p>
                    </div>

                    <div className="text-sm font-semibold text-foreground">สรุปความเสี่ยง</div>
                    <div className="flex gap-2">
                        <div className="flex-1 p-2.5 rounded-lg bg-destructive/10 text-center">
                            <div className="text-xl font-bold text-destructive">{highCount}</div>
                            <div className="text-[10px] text-muted-foreground">สูง</div>
                        </div>
                        <div className="flex-1 p-2.5 rounded-lg bg-warning/10 text-center">
                            <div className="text-xl font-bold text-warning">{mediumCount}</div>
                            <div className="text-[10px] text-muted-foreground">กลาง</div>
                        </div>
                        <div className="flex-1 p-2.5 rounded-lg bg-success/10 text-center">
                            <div className="text-xl font-bold text-success">{lowCount}</div>
                            <div className="text-[10px] text-muted-foreground">ต่ำ</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {results.map((risk, i) => (
                            <Card
                                key={risk.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedRisk?.id === risk.id ? "ring-2 ring-primary" : ""
                                    } ${getRiskBgColor(risk.type)}`}
                                onClick={() => {
                                    setSelectedRisk(risk);
                                    setFocusedPage(risk.anchors[0]?.page ?? risk.page ?? 1);
                                }}
                            >
                                <CardContent className="p-3 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${risk.type === "high" ? "bg-destructive text-destructive-foreground" : risk.type === "medium" ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"
                                            }`}>{i + 1}</div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-foreground text-sm">{risk.clause}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{risk.description}</p>
                                        </div>
                                    </div>
                                    {selectedRisk?.id === risk.id && (
                                        <div className="mt-2 p-2.5 bg-card rounded-lg border">
                                            <p className="text-xs font-medium text-primary mb-1">บริบทข้อเสี่ยง</p>
                                            <p className="text-xs text-muted-foreground">{risk.description}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs flex-1"
                                                    onClick={() => handleExplain(risk)}
                                                    disabled={explainLoadingId === risk.id}
                                                >
                                                    {explainLoadingId === risk.id ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> กำลังอธิบาย...</> : "อธิบาย"}
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-7 text-xs flex-1 text-primary border-primary/30">Ask Lawyer</Button>
                                            </div>
                                            {explainLoadingId === risk.id && (
                                                <div className="flex items-start gap-2 mt-2 px-2.5 py-2 rounded-md border bg-secondary/20">
                                                    <Loader2 className="h-3.5 w-3.5 mt-0.5 animate-spin text-primary flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-medium text-foreground">{explainStage.title}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">{explainStage.hint}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {explainErrorByRiskId[risk.id] && (
                                                <p className="text-xs text-destructive mt-2">{explainErrorByRiskId[risk.id]}</p>
                                            )}
                                            {explainByRiskId[risk.id] && (
                                                <div className="mt-2 p-2.5 rounded-md border bg-secondary/20 space-y-2">
                                                    <p className="text-xs font-semibold text-foreground">คำอธิบายจาก AI</p>
                                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                                        {explainByRiskId[risk.id].explanation_th || explainByRiskId[risk.id].explanation_en}
                                                    </p>
                                                    {explainByRiskId[risk.id].business_impact.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-medium text-foreground mb-1">ผลกระทบทางธุรกิจ</p>
                                                            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                                                                {explainByRiskId[risk.id].business_impact.map((item, idx) => (
                                                                    <li key={`${risk.id}-impact-${idx}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {explainByRiskId[risk.id].worst_case_scenario && (
                                                        <div>
                                                            <p className="text-xs font-medium text-foreground mb-1">กรณีเลวร้ายที่สุด</p>
                                                            <p className="text-xs text-muted-foreground">{explainByRiskId[risk.id].worst_case_scenario}</p>
                                                        </div>
                                                    )}
                                                    {explainByRiskId[risk.id].compliance_notice && (
                                                        <p className="text-[11px] text-muted-foreground italic border-t pt-2">
                                                            {explainByRiskId[risk.id].compliance_notice}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => { setResults(null); setFile(null); }}>
                        Analyze Another Document
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// HISTORY PANEL (includes signing history)
// ══════════════════════════════════════════════════
function RiskPanelV2({
    chatHistory,
    factoryInfo,
    onRiskAnalysisComplete,
}: {
    chatHistory: ChatMessagePayload[];
    factoryInfo?: FactoryInfoPayload;
    onRiskAnalysisComplete?: (result: {
        overallRisk: RiskCheckResponse["overall_risk"];
        summary: string;
        highCount: number;
        mediumCount: number;
        lowCount: number;
    }) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [riskItems, setRiskItems] = useState<RiskItem[] | null>(null);
    const [acceptableItems, setAcceptableItems] = useState<RiskItem[]>([]);
    const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
    const [analysisSummary, setAnalysisSummary] = useState("");
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [overallRisk, setOverallRisk] = useState<RiskCheckResponse["overall_risk"]>("medium");
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const [remotePreviewUrl, setRemotePreviewUrl] = useState<string | null>(null);
    const [focusedPage, setFocusedPage] = useState<number | null>(null);
    const [mobileView, setMobileView] = useState<"summary" | "document">("summary");
    const [explainLoadingId, setExplainLoadingId] = useState<string | null>(null);
    const [explainErrorByRiskId, setExplainErrorByRiskId] = useState<Record<string, string>>({});
    const [explainByRiskId, setExplainByRiskId] = useState<Record<string, RiskExplainResponse>>({});
    const analyzeStage = useProgressStage(analyzing, RISK_ANALYZE_STAGES, 1500);
    const explainStage = useProgressStage(Boolean(explainLoadingId), EXPLAIN_RISK_STAGES, 1400);
    const lawyerCostSaved = 15000;
    const allFindings = [...(riskItems || []), ...acceptableItems];
    const previewUrl = remotePreviewUrl || localPreviewUrl;

    const mapRiskItem = (risk: RiskCheckResponse["risks"][number], group?: "risk" | "acceptable"): RiskItem => {
        const type =
            risk.level === "critical" || risk.level === "high"
                ? "high"
                : risk.level === "medium"
                    ? "medium"
                    : "low";

        return {
            id: risk.risk_id,
            type,
            group: group || (type === "low" || risk.level === "safe" ? "acceptable" : "risk"),
            clause: risk.title_th || risk.title_en || risk.clause_ref || "ไม่ระบุข้อสัญญา",
            description: risk.description_th || risk.description_en,
            page: risk.anchors?.[0]?.page || 1,
            level: risk.level,
            clauseRef: risk.clause_ref || "",
            category: risk.category || "general",
            titleTh: risk.title_th || "",
            titleEn: risk.title_en || "",
            descriptionTh: risk.description_th || "",
            descriptionEn: risk.description_en || "",
            anchors: (risk.anchors || []).map((anchor) => ({
                riskId: risk.risk_id,
                page: anchor.page,
                x: anchor.x,
                y: anchor.y,
                width: anchor.width,
                height: anchor.height,
                snippet: anchor.snippet,
            })),
        };
    };

    const dedupeRiskItems = (items: RiskItem[]) => {
        const seen = new Set<string>();
        return items.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    };

    const applyAnalysisResponse = (response: RiskCheckResponse) => {
        const mappedRisks = response.risks.map((risk) => mapRiskItem(risk));
        const activeRisks = mappedRisks.filter((risk) => risk.group !== "acceptable" && risk.type !== "low");
        const fallbackAcceptable = mappedRisks.filter((risk) => risk.group === "acceptable" || risk.type === "low");
        const mappedAcceptable = (response.acceptable_findings || []).map((finding) => mapRiskItem(finding, "acceptable"));
        const nextAcceptable = dedupeRiskItems([...mappedAcceptable, ...fallbackAcceptable]).map((item) => ({
            ...item,
            group: "acceptable" as const,
        }));
        const firstFinding = activeRisks[0] || nextAcceptable[0] || null;

        setRiskItems(activeRisks);
        setAcceptableItems(nextAcceptable);
        setSelectedRisk(firstFinding);
        setFocusedPage(firstFinding?.anchors[0]?.page ?? firstFinding?.page ?? 1);
        setAnalysisSummary(response.summary_th || response.summary_en || "วิเคราะห์เสร็จสิ้น");
        setOverallRisk(response.overall_risk);
        setExplainByRiskId({});
        setExplainErrorByRiskId({});
        setMobileView("summary");

        onRiskAnalysisComplete?.({
            overallRisk: response.overall_risk,
            summary: response.summary_th || response.summary_en || "วิเคราะห์เสร็จสิ้น",
            highCount: activeRisks.filter((risk) => risk.type === "high").length,
            mediumCount: activeRisks.filter((risk) => risk.type === "medium").length,
            lowCount: nextAcceptable.length,
        });
    };

    useEffect(() => {
        if (!file) {
            setLocalPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setLocalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setRemotePreviewUrl(null);
            setAnalysisError(null);
            setMobileView("summary");
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAnalysisError(null);
        try {
            if (!file) return;
            const response: RiskCheckResponse = await analyzeContractRisk(file, chatHistory, factoryInfo, "th");
            const mappedRisks = response.risks.map((risk) => mapRiskItem(risk));
            const activeRisks = mappedRisks.filter((risk) => risk.group !== "acceptable" && risk.type !== "low");
            const fallbackAcceptable = mappedRisks.filter((risk) => risk.group === "acceptable" || risk.type === "low");
            const mappedAcceptable = (response.acceptable_findings || []).map((finding) => mapRiskItem(finding, "acceptable"));
            const nextAcceptable = dedupeRiskItems([...mappedAcceptable, ...fallbackAcceptable]).map((item) => ({
                ...item,
                group: "acceptable" as const,
            }));
            const firstFinding = activeRisks[0] || nextAcceptable[0] || null;

            setRiskItems(activeRisks);
            setAcceptableItems(nextAcceptable);
            setSelectedRisk(firstFinding);
            setFocusedPage(firstFinding?.anchors[0]?.page ?? firstFinding?.page ?? 1);
            setAnalysisSummary(response.summary_th || response.summary_en || "วิเคราะห์เสร็จสิ้น");
            setOverallRisk(response.overall_risk);
            setExplainByRiskId({});
            setExplainErrorByRiskId({});
            setMobileView("summary");

            onRiskAnalysisComplete?.({
                overallRisk: response.overall_risk,
                summary: response.summary_th || response.summary_en || "วิเคราะห์เสร็จสิ้น",
                highCount: activeRisks.filter((risk) => risk.type === "high").length,
                mediumCount: activeRisks.filter((risk) => risk.type === "medium").length,
                lowCount: nextAcceptable.length,
            });
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "Risk analysis failed");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleOpenLatestRiskDemo = async () => {
        setAnalysisError(null);
        try {
            const latest = await getLatestContractFromHistory({ requirePdf: true });
            setFile(null);
            setRemotePreviewUrl(latest.pdf_url);
            applyAnalysisResponse(DEMO_RISK_RESPONSE);
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "Failed to load latest contract PDF");
        }
    };

    const handleExplain = async (risk: RiskItem) => {
        setExplainLoadingId(risk.id);
        setExplainErrorByRiskId((prev) => ({ ...prev, [risk.id]: "" }));
        try {
            const payload: RiskExplainRequest = {
                risk_id: risk.id,
                title_th: risk.titleTh,
                title_en: risk.titleEn || risk.clause,
                level: risk.level,
                clause_ref: risk.clauseRef || "N/A",
                description_th: risk.descriptionTh,
                description_en: risk.descriptionEn || risk.description,
                recommendation_th: "",
                recommendation_en: "",
                category: risk.category || "general",
            };
            const response = await explainRisk(payload);
            setExplainByRiskId((prev) => ({ ...prev, [risk.id]: response }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Explain request failed";
            setExplainErrorByRiskId((prev) => ({ ...prev, [risk.id]: message }));
        } finally {
            setExplainLoadingId(null);
        }
    };

    const handleDownloadSummary = () => {
        if (!riskItems) return;
        const riskSection = riskItems.length
            ? riskItems
                .map((risk, index) => `${index + 1}. [${risk.type.toUpperCase()}] ${risk.clause}\n   ประเด็น: ${risk.description}\n   หน้า: ${risk.page}\n`)
                .join("\n")
            : "ไม่พบประเด็นเสี่ยงสำคัญ\n";
        const acceptableSection = acceptableItems.length
            ? acceptableItems
                .map((risk, index) => `${index + 1}. ${risk.clause}\n   สถานะ: ${risk.description}\n   หน้า: ${risk.page}\n`)
                .join("\n")
            : "ไม่มีข้อที่จัดอยู่ในหมวดครอบคลุมแล้ว\n";
        const content = `สรุปผลตรวจความเสี่ยงสัญญา NEOEM AI\n${"=".repeat(40)}\n\nวันที่: ${new Date().toLocaleDateString("th-TH")}\nเอกสาร: ${file?.name || "สัญญา"}\n\nความเสี่ยงที่ควรตรวจต่อ\n${riskSection}\nข้อที่ครอบคลุมแล้ว / รับได้\n${acceptableSection}`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "รายงานสรุปความเสี่ยงสัญญา.txt";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPreview = () => {
        if (!previewUrl) return;
        if (!file) {
            openUrlInNewTab(previewUrl);
            return;
        }
        const link = document.createElement("a");
        link.href = previewUrl;
        link.download = file.name;
        link.click();
    };

    const handleReset = () => {
        setRiskItems(null);
        setAcceptableItems([]);
        setSelectedRisk(null);
        setFile(null);
        setLocalPreviewUrl(null);
        setRemotePreviewUrl(null);
        setFocusedPage(null);
        setAnalysisSummary("");
        setAnalysisError(null);
        setExplainByRiskId({});
        setExplainErrorByRiskId({});
        setMobileView("summary");
    };

    const getRiskBgColor = (type: RiskItem["type"]) => {
        switch (type) {
            case "high":
                return "bg-destructive/10";
            case "medium":
                return "bg-warning/10";
            case "low":
                return "bg-success/10";
        }
    };

    const highCount = riskItems?.filter((risk) => risk.type === "high").length || 0;
    const mediumCount = riskItems?.filter((risk) => risk.type === "medium").length || 0;
    const acceptableCount = acceptableItems.length;
    const highlightBoxes: RiskHighlight[] = allFindings.flatMap((risk) => risk.anchors);
    const overallRiskLabel: Record<string, string> = {
        critical: "วิกฤต",
        high: "สูง",
        medium: "กลาง",
        low: "ต่ำ",
        safe: "ปลอดภัย",
    };
    const overallRiskPercentMap: Record<string, number> = {
        critical: 95,
        high: 80,
        medium: 60,
        low: 35,
        safe: 15,
    };
    const overallRiskHintMap: Record<string, string> = {
        critical: "พบเงื่อนไขเสี่ยงสูงมาก ควรให้ผู้เชี่ยวชาญตรวจทานก่อนดำเนินการ",
        high: "มีประเด็นสำคัญที่ควรเจรจาแก้ไขก่อนลงนาม",
        medium: "มีจุดที่ควรทบทวนเพิ่มเติม แต่ยังสามารถจัดการได้",
        low: "พบความเสี่ยงต่ำ และมีหลายข้อที่จัดการได้ในทางปฏิบัติ",
        safe: "ภาพรวมเงื่อนไขอยู่ในเกณฑ์ที่เหมาะสมและค่อนข้างสมดุล",
    };
    const overallRiskToneClass: Record<string, string> = {
        critical: "text-destructive",
        high: "text-destructive",
        medium: "text-warning",
        low: "text-success",
        safe: "text-success",
    };
    const overallRiskPercent = overallRiskPercentMap[overallRisk] ?? 60;

    const renderFindingCard = (risk: RiskItem, index: number, section: "risk" | "acceptable") => (
        <Card
            key={risk.id}
            className={`cursor-pointer transition-all hover:shadow-md ${selectedRisk?.id === risk.id ? "ring-2 ring-primary" : ""} ${getRiskBgColor(risk.type)}`}
            onClick={() => {
                setSelectedRisk(risk);
                setFocusedPage(risk.anchors[0]?.page ?? risk.page ?? 1);
                setMobileView("document");
            }}
        >
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${risk.type === "high" ? "bg-destructive text-destructive-foreground" : risk.type === "medium" ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}`}>
                        {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground text-sm">{risk.clause}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${section === "acceptable" ? "bg-success/10 text-success" : risk.type === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                                {section === "acceptable" ? "ครอบคลุมแล้ว" : risk.type === "high" ? "ต้องแก้ก่อนเซ็น" : "ควรทบทวน"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{risk.description}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">หน้า {risk.page}</p>
                    </div>
                </div>
                {selectedRisk?.id === risk.id && (
                    <div className="mt-2 p-2.5 bg-card rounded-lg border">
                        <p className={`text-xs font-medium mb-1 ${section === "acceptable" ? "text-success" : "text-primary"}`}>
                            {section === "acceptable" ? "บริบทข้อสรุป" : "บริบทข้อเสี่ยง"}
                        </p>
                        <p className="text-xs text-muted-foreground">{risk.description}</p>
                        <div className="flex gap-2 mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    void handleExplain(risk);
                                }}
                                disabled={explainLoadingId === risk.id}
                            >
                                {explainLoadingId === risk.id ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> กำลังอธิบาย...</> : "อธิบายเพิ่มเติม"}
                            </Button>
                            {section === "risk" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs flex-1 text-primary border-primary/30"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    Ask Lawyer
                                </Button>
                            )}
                        </div>
                        {explainLoadingId === risk.id && (
                            <div className="flex items-start gap-2 mt-2 px-2.5 py-2 rounded-md border bg-secondary/20">
                                <Loader2 className="h-3.5 w-3.5 mt-0.5 animate-spin text-primary flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-foreground">{explainStage.title}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{explainStage.hint}</p>
                                </div>
                            </div>
                        )}
                        {explainErrorByRiskId[risk.id] && (
                            <p className="text-xs text-destructive mt-2">{explainErrorByRiskId[risk.id]}</p>
                        )}
                        {explainByRiskId[risk.id] && (
                            <div className="mt-2 p-2.5 rounded-md border bg-secondary/20 space-y-2">
                                <p className="text-xs font-semibold text-foreground">คำอธิบายจาก AI</p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                    {explainByRiskId[risk.id].explanation_th || explainByRiskId[risk.id].explanation_en}
                                </p>
                                {explainByRiskId[risk.id].business_impact.length > 0 && section === "risk" && (
                                    <div>
                                        <p className="text-xs font-medium text-foreground mb-1">ผลกระทบทางธุรกิจ</p>
                                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                                            {explainByRiskId[risk.id].business_impact.map((item, idx) => (
                                                <li key={`${risk.id}-impact-${idx}`}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {explainByRiskId[risk.id].worst_case_scenario && section === "risk" && (
                                    <div>
                                        <p className="text-xs font-medium text-foreground mb-1">กรณีเลวร้ายที่สุด</p>
                                        <p className="text-xs text-muted-foreground">{explainByRiskId[risk.id].worst_case_scenario}</p>
                                    </div>
                                )}
                                {explainByRiskId[risk.id].compliance_notice && (
                                    <p className="text-[11px] text-muted-foreground italic border-t pt-2">
                                        {explainByRiskId[risk.id].compliance_notice}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const renderSummaryPanel = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
                <BadgeDollarSign className="h-4 w-4 text-success flex-shrink-0" />
                <span className="text-xs font-medium text-success">Savings: ~฿{lawyerCostSaved.toLocaleString()}</span>
            </div>

            {analysisSummary && <p className="text-xs text-muted-foreground">{analysisSummary}</p>}

            <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">ระดับความเสี่ยงรวมของสัญญา</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${overallRisk === "critical" || overallRisk === "high" ? "bg-destructive/10 text-destructive" : overallRisk === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                        {overallRiskLabel[overallRisk] || overallRisk}
                    </span>
                </div>

                <RiskGauge
                    percent={overallRiskPercent}
                    toneClass={overallRiskToneClass[overallRisk] || "text-foreground"}
                />

                <p className="text-xs text-muted-foreground text-center">
                    {overallRiskHintMap[overallRisk] || "กำลังประเมินความเสี่ยงโดยรวมของสัญญา"}
                </p>
            </div>

            <div className="text-sm font-semibold text-foreground">สรุปผลการตรวจ</div>
            <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-destructive/10 text-center">
                    <div className="text-xl font-bold text-destructive">{highCount}</div>
                    <div className="text-[10px] text-muted-foreground">สูง / วิกฤต</div>
                </div>
                <div className="p-2.5 rounded-lg bg-warning/10 text-center">
                    <div className="text-xl font-bold text-warning">{mediumCount}</div>
                    <div className="text-[10px] text-muted-foreground">ควรทบทวน</div>
                </div>
                <div className="p-2.5 rounded-lg bg-success/10 text-center">
                    <div className="text-xl font-bold text-success">{acceptableCount}</div>
                    <div className="text-[10px] text-muted-foreground">ครอบคลุมแล้ว</div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-semibold text-foreground">ประเด็นเสี่ยงที่ควรตรวจต่อ</p>
                </div>
                {riskItems && riskItems.length > 0 ? (
                    riskItems.map((risk, index) => renderFindingCard(risk, index, "risk"))
                ) : (
                    <Card className="bg-success/5 border-success/20">
                        <CardContent className="p-4 flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-foreground">ยังไม่พบประเด็นเสี่ยงหลักที่ต้องรีบแก้ไข</p>
                                <p className="text-xs text-muted-foreground mt-1">ระบบยังคงแสดงข้อที่ครอบคลุมแล้วด้านล่าง เพื่อให้ดูประกอบกับเอกสารจริงได้สะดวก</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-sm font-semibold text-foreground">ข้อที่ครอบคลุมแล้ว / รับได้</p>
                </div>
                {acceptableItems.length > 0 ? (
                    acceptableItems.map((risk, index) => renderFindingCard(risk, index, "acceptable"))
                ) : (
                    <Card className="bg-secondary/20">
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-foreground">ยังไม่มีข้อสรุปในหมวดนี้</p>
                            <p className="text-xs text-muted-foreground mt-1">ถ้าระบบพบเงื่อนไขที่ครอบคลุมแล้วหรือความกังวลระดับต่ำ จะแสดงในส่วนนี้</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Button variant="outline" className="w-full lg:hidden" onClick={() => setMobileView("document")}>
                <Eye className="h-4 w-4 mr-2" /> เปิดเอกสาร
            </Button>

            <Button variant="outline" className="w-full" onClick={handleReset}>
                Analyze Another Document
            </Button>
        </div>
    );

    if (!riskItems) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="max-w-md w-full p-6 space-y-6">
                    <div className="space-y-1 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Check Risk</h1>
                        <p className="text-sm text-muted-foreground">Analyze a contract or jump straight into the latest demo result.</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
                        <BadgeDollarSign className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">
                            Estimated Lawyer Cost Savings: ~฿{lawyerCostSaved.toLocaleString()}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-foreground text-center">อัปโหลดสัญญาเพื่อตรวจความเสี่ยง</h2>

                    <label className="cursor-pointer block">
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} className="hidden" />
                        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${file ? "border-success bg-success/5" : "border-border hover:border-primary/50"}`}>
                            {file ? (
                                <div className="space-y-2">
                                    <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
                                    <p className="font-medium text-foreground">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                                    <p className="text-foreground font-medium">คลิกเพื่ออัปโหลด PDF หรือวางไฟล์</p>
                                    <p className="text-sm text-muted-foreground">Supports PDF, PNG, JPG</p>
                                </div>
                            )}
                        </div>
                    </label>

                    <div className="relative">
                        <Button onClick={handleAnalyze} disabled={!file || analyzing} className="w-full" size="lg">
                        {analyzing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> กำลังวิเคราะห์ด้วย OCR + Legal AI...</> : <><Search className="h-5 w-5 mr-2" /> วิเคราะห์สัญญา</>}
                        </Button>
                        <button
                            type="button"
                            aria-label="Open latest risk demo result"
                            title="Open latest risk demo result"
                            className="absolute left-[calc(100%+0.5rem)] top-0 h-11 w-16 rounded-md cursor-pointer bg-transparent opacity-0"
                            onClick={() => void handleOpenLatestRiskDemo()}
                        />
                    </div>
                    {analyzing && (
                        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-secondary/20">
                            <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground">{analyzeStage.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{analyzeStage.hint}</p>
                            </div>
                        </div>
                    )}
                    {analysisError && <p className="text-xs text-center text-destructive">{analysisError}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col lg:flex-row">
            <div className="lg:hidden border-b bg-card px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
                <div className="inline-flex rounded-lg border bg-background p-1">
                    <button
                        type="button"
                        onClick={() => setMobileView("summary")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mobileView === "summary" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                        สรุปผล
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileView("document")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mobileView === "document" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                        เอกสาร
                    </button>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleReset}>
                    <X className="h-3.5 w-3.5 mr-1" /> เริ่มใหม่
                </Button>
            </div>

            <div className={`${mobileView === "document" ? "flex" : "hidden"} lg:flex lg:w-[60%] border-r flex-col min-h-0`}>
                <div className="h-10 border-b flex items-center justify-between px-4 bg-card flex-shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4" />
                        <span className="text-foreground font-medium">Document Preview</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={!previewUrl} onClick={handleDownloadPreview}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden bg-secondary/10 min-h-[55vh] lg:min-h-0">
                    <RiskPdfViewer
                        fileUrl={previewUrl}
                        highlights={highlightBoxes}
                        selectedRiskId={selectedRisk?.id || null}
                        focusedPage={focusedPage}
                        onHighlightClick={(riskId) => {
                            const risk = allFindings.find((item) => item.id === riskId) || null;
                            setSelectedRisk(risk);
                            setFocusedPage(risk?.anchors[0]?.page ?? risk?.page ?? null);
                            setMobileView("document");
                        }}
                    />
                </div>
            </div>

            <div className={`${mobileView === "summary" ? "flex" : "hidden"} lg:flex lg:w-[40%] flex-col min-h-0`}>
                <div className="h-10 border-b flex items-center justify-between px-4 bg-card flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">ผลการตรวจความเสี่ยง</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownloadSummary}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Summary
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs hidden lg:inline-flex" onClick={handleReset}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                {renderSummaryPanel()}
            </div>
        </div>
    );
}

function HistoryPanel() {
    const [contracts, setContracts] = useState<ContractHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadContracts = async () => {
            try {
                setLoading(true);
                setError(null);
                const results = await getContractHistory();
                if (active) {
                    setContracts(results.contracts);
                }
            } catch (err) {
                if (active) {
                    setError(err instanceof Error ? err.message : "Failed to load contract history");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadContracts();
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Legal Hub — Contract History</h2>
            <p className="text-sm text-muted-foreground">All your drafted, reviewed, and signed contracts in one place.</p>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Drafts & Reviews
                </h3>
                <div className="space-y-2">
                    {loading && (
                        <div className="p-4 border rounded-lg bg-card text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading contract history...
                        </div>
                    )}
                    {!loading && error && (
                        <div className="p-4 border rounded-lg bg-card text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    {!loading && !error && contracts.length === 0 && (
                        <div className="p-4 border rounded-lg bg-card text-sm text-muted-foreground">
                            No drafted contracts found in Supabase Storage yet.
                        </div>
                    )}
                    {!loading && !error && contracts.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg transition-colors bg-card">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${entry.pdf_url && entry.docx_url ? "bg-success" : "bg-warning"}`} />
                                <div>
                                    <p className="text-sm font-medium text-foreground">{entry.base_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : "Unknown date"} {entry.has_deal_sheet ? "· Deal sheet saved" : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {entry.pdf_url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(entry.pdf_url!, `${entry.contract_id}.pdf`)}
                                    >
                                        <Download className="h-4 w-4 mr-1" /> PDF
                                    </Button>
                                )}
                                {entry.docx_url && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(entry.docx_url!, `${entry.contract_id}.docx`)}
                                    >
                                        <Download className="h-4 w-4 mr-1" /> Word
                                    </Button>
                                )}
                                <Badge variant="outline">{entry.contract_id}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-primary" /> Signing History
                </h3>
                <div className="space-y-2">
                    {mockSignHistory.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors bg-card">
                            <div className="flex items-center gap-3">
                                <PenTool className={`h-4 w-4 ${entry.status === "completed" ? "text-success" : "text-warning"}`} />
                                <div>
                                    <p className="text-sm font-medium text-foreground">{entry.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{entry.date} · {entry.signedBy}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className={entry.status === "completed" ? "text-success border-success/30" : "text-warning border-warning/30"}>
                                {entry.status === "completed" ? "Signed" : "Pending"}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
                Compare versions to track how risks change after negotiation
            </p>
        </div>
    );
}
