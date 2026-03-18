"use client";

import { useEffect, useState } from "react";
import {
    FileText, Search, FolderClock, X, Upload, Loader2,
    AlertTriangle, CheckCircle2, XCircle, Download, Eye,
    BadgeDollarSign, Sparkles, History, PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    analyzeContractRisk,
    downloadFile,
    explainRisk,
    extractContext,
    finalizeContract,
    generateDraft,
    getContractHistory,
    getTemplates,
    type ChatMessagePayload,
    type ContractArticle,
    type ContractHistoryItem,
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
}

// ── Draft Contract types ──
interface ContractData {
    template: string;
    buyerName: string;
    sellerName: string;
    productType: string;
    productSpec: string;
    quantity: string;
    totalPrice: string;
    deliveryDate: string;
    deliveryAddress: string;
    penaltyClause: string;
    paymentTerms: string;
    qualityStandards: string;
    warrantyPeriod: string;
    ipOwnership: string;
    additionalClauses: string;
}

const templates = [
    { id: "sales", label: "สัญญาซื้อขาย / Sales Contract", icon: "📝" },
    { id: "hire-of-work", label: "สัญญาจ้างทำของ / Hire of Work", icon: "🔧" },
    { id: "oem", label: "สัญญา OEM Manufacturing", icon: "🏭" },
    { id: "nda", label: "สัญญารักษาความลับ / NDA", icon: "🔒" },
    { id: "distribution", label: "สัญญาตัวแทนจำหน่าย / Distribution", icon: "📦" },
];

// ── Risk types ──
interface RiskItem {
    id: string;
    type: "high" | "medium" | "low";
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
                    {activeTab === "draft" && <DraftPanel factoryName={factoryName} chatHistory={chatHistory} factoryInfo={factoryInfo} />}
                    {activeTab === "risk" && <RiskPanel chatHistory={chatHistory} factoryInfo={factoryInfo} />}
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
    oem: "hybrid_oem",
    nda: "nda",
    distribution: "distribution",
};

function DraftPanel({
    factoryName,
    chatHistory,
    factoryInfo,
}: {
    factoryName: string;
    chatHistory: ChatMessagePayload[];
    factoryInfo?: FactoryInfoPayload;
}) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [loading, setLoading] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draftResult, setDraftResult] = useState<GenerateDraftResponse | null>(null);
    const [downloadUrls, setDownloadUrls] = useState<{ pdf_url: string | null; docx_url: string | null } | null>(null);
    const [recommendedTemplate, setRecommendedTemplate] = useState<string | null>(null);
    const [formData, setFormData] = useState<ContractData>({
        template: "",
        buyerName: "Your Company",
        sellerName: factoryName,
        productType: "Sunscreen SPF50 Mousse",
        productSpec: "",
        quantity: "1000",
        totalPrice: "120000",
        deliveryDate: "",
        deliveryAddress: "",
        penaltyClause: "0.1",
        paymentTerms: "30-40-30",
        qualityStandards: "",
        warrantyPeriod: "30",
        ipOwnership: "buyer",
        additionalClauses: "",
    });

    useEffect(() => {
        let active = true;
        const seedFromChat = async () => {
            if (chatHistory.length === 0) return;
            try {
                const ctx = await extractContext(chatHistory, factoryName, factoryInfo?.factory_id);
                if (!active) return;
                const suggested = Object.entries(TEMPLATE_TO_API).find(([, value]) => value === ctx.suggested_template)?.[0] ?? "";
                setRecommendedTemplate(ctx.suggested_template);
                setFormData((prev) => ({
                    ...prev,
                    template: prev.template || suggested,
                    buyerName: ctx.deal_sheet.client?.name || prev.buyerName,
                    sellerName: ctx.deal_sheet.vendor?.name || prev.sellerName,
                    productType: ctx.deal_sheet.product?.name || prev.productType,
                    productSpec: ctx.deal_sheet.product?.specs || prev.productSpec,
                    quantity: ctx.deal_sheet.product?.quantity?.toString() || prev.quantity,
                    totalPrice: ctx.deal_sheet.total_price?.toString() || prev.totalPrice,
                    deliveryDate: ctx.deal_sheet.delivery_date || prev.deliveryDate,
                    ipOwnership: ctx.deal_sheet.commercial_terms?.ip_ownership || prev.ipOwnership,
                    additionalClauses: ctx.deal_sheet.additional_notes || prev.additionalClauses,
                }));
            } catch {
                // Keep manual entry if extraction fails.
            }
        };
        seedFromChat();
        return () => {
            active = false;
        };
    }, [chatHistory, factoryInfo?.factory_id, factoryName]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const templateType = TEMPLATE_TO_API[formData.template] || "hire_of_work";
            const response = await generateDraft({
                template_type: templateType,
                deal_sheet: {
                    vendor: { name: formData.sellerName || factoryName, role: "seller" },
                    client: { name: formData.buyerName || "Your Company", role: "buyer" },
                    product: {
                        name: formData.productType,
                        specs: formData.productSpec || undefined,
                        quantity: Number(formData.quantity) || undefined,
                        unit: "pieces",
                    },
                    total_price: Number(formData.totalPrice) || undefined,
                    delivery_date: formData.deliveryDate || undefined,
                    commercial_terms: {
                        ip_ownership: formData.ipOwnership,
                        penalty_type: formData.penaltyClause === "none" ? "none" : "percentage_daily",
                        penalty_details: formData.penaltyClause === "none" ? undefined : `${formData.penaltyClause}% per day`,
                    },
                    additional_notes: formData.additionalClauses || undefined,
                },
                parties: [
                    { name: formData.buyerName || "Your Company", role: "buyer" },
                    { name: formData.sellerName || factoryName, role: "seller" },
                ],
                product: {
                    name: formData.productType,
                    specs: formData.productSpec || undefined,
                    quantity: Number(formData.quantity) || undefined,
                    unit: "pieces",
                },
                total_price: Number(formData.totalPrice) || undefined,
                delivery_date: formData.deliveryDate || undefined,
                commercial_terms: {
                    ip_ownership: formData.ipOwnership,
                    penalty_type: formData.penaltyClause === "none" ? "none" : "percentage_daily",
                    penalty_details: formData.penaltyClause === "none" ? undefined : `${formData.penaltyClause}% per day`,
                },
                language: "both",
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
        setFinalizing(true);
        setError(null);
        try {
            const result = await finalizeContract({
                contract_title: draftResult.contract_title,
                articles: draftResult.articles as ContractArticle[],
                preamble_th: draftResult.preamble_th,
                effective_date: draftResult.effective_date || undefined,
                parties: [
                    { name: formData.buyerName || "Your Company", role: "buyer" },
                    { name: formData.sellerName || factoryName, role: "seller" },
                ],
                output_format: "both",
            });
            setDownloadUrls({
                pdf_url: result.pdf_url,
                docx_url: result.docx_url,
            });
            setStep(4);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to finalize contract");
        } finally {
            setFinalizing(false);
        }
    };

    const autoFillClass = "border-primary/30 bg-primary/5";

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* AI Recommendation */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-sm text-foreground">
                    {recommendedTemplate
                        ? <>💡 Based on your chat, we recommend: <span className="font-semibold text-primary">{recommendedTemplate.replace(/_/g, " ")}</span></>
                        : <>💡 Select a template to generate a legally structured first draft.</>}
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

            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Select Contract Template</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {templates.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => setFormData({ ...formData, template: tpl.id })}
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
                                <Select value={formData.paymentTerms} onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30-40-30">30-40-30 Milestone</SelectItem>
                                        <SelectItem value="50-50">50-50 Split</SelectItem>
                                        <SelectItem value="100-upfront">100% Upfront</SelectItem>
                                    </SelectContent>
                                </Select>
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
                        <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Intellectual Property</legend>
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
                            <Label>Additional Clauses</Label>
                            <Textarea value={formData.additionalClauses} onChange={(e) => setFormData({ ...formData, additionalClauses: e.target.value })} placeholder="Any special terms..." rows={2} />
                        </div>
                    </fieldset>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                        <Button onClick={handleGenerate} disabled={loading} className="flex-1">
                            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Contract</>}
                        </Button>
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
                                    {templates.find((t) => t.id === formData.template)?.label || "Manufacturing Agreement"}
                                </p>
                            </div>
                            <p className="text-muted-foreground">
                                This Agreement is entered into between <strong className="text-foreground">{formData.buyerName}</strong> ("Buyer") and <strong className="text-primary">{formData.sellerName}</strong> ("Manufacturer").
                            </p>
                            <p className="text-muted-foreground">
                                <strong className="text-foreground">Product:</strong> {formData.productType} — Qty: {formData.quantity} pcs — Total: ฿{parseInt(formData.totalPrice).toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                                <strong className="text-foreground">Payment:</strong> {formData.paymentTerms} milestone | <strong className="text-foreground">Delivery:</strong> {formData.deliveryDate || "TBD"}
                            </p>
                            <p className="text-muted-foreground">
                                <strong className="text-foreground">IP Ownership:</strong> {formData.ipOwnership === "buyer" ? "Buyer (Brand Owner)" : formData.ipOwnership === "seller" ? "Manufacturer" : "Joint"}
                            </p>
                            {formData.qualityStandards && (
                                <p className="text-muted-foreground"><strong className="text-foreground">Quality:</strong> {formData.qualityStandards}</p>
                            )}
                            <p className="text-xs text-muted-foreground italic mt-4">
                                This is a preview. Full legal language will be included in the downloadable document.
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
                        <p className="font-semibold text-foreground text-lg">{draftResult?.contract_filename || "Contract_Draft"}</p>
                        <p className="text-sm text-muted-foreground">Saved to History & Legal Hub</p>
                    </div>
                    <div className="flex gap-3 max-w-sm mx-auto">
                        {downloadUrls?.pdf_url ? (
                            <Button
                                type="button"
                                className="w-full flex-1"
                                size="lg"
                                onClick={() => downloadFile(downloadUrls.pdf_url!, `${draftResult?.contract_filename || "contract"}.pdf`)}
                            >
                                <Download className="h-5 w-5 mr-2" /> PDF
                            </Button>
                        ) : (
                            <Button className="flex-1" size="lg" disabled>
                                <Download className="h-5 w-5 mr-2" /> PDF
                            </Button>
                        )}
                        {downloadUrls?.docx_url ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex-1"
                                size="lg"
                                onClick={() => downloadFile(downloadUrls.docx_url!, `${draftResult?.contract_filename || "contract"}.docx`)}
                            >
                                <Download className="h-5 w-5 mr-2" /> Word
                            </Button>
                        ) : (
                            <Button variant="outline" className="flex-1" size="lg" disabled>
                                <Download className="h-5 w-5 mr-2" /> Word
                            </Button>
                        )}
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
}: {
    chatHistory: ChatMessagePayload[];
    factoryInfo?: FactoryInfoPayload;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<RiskItem[] | null>(null);
    const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
    const [analysisSummary, setAnalysisSummary] = useState<string>("");
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [focusedPage, setFocusedPage] = useState<number | null>(null);
    const [explainLoadingId, setExplainLoadingId] = useState<string | null>(null);
    const [explainErrorByRiskId, setExplainErrorByRiskId] = useState<Record<string, string>>({});
    const [explainByRiskId, setExplainByRiskId] = useState<Record<string, RiskExplainResponse>>({});
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
            const response: RiskCheckResponse = await analyzeContractRisk(file, chatHistory, factoryInfo, "both");
            const mapped = response.risks.map((risk) => ({
                id: risk.risk_id,
                type: risk.level === "critical" || risk.level === "high" ? "high" as const : risk.level === "medium" ? "medium" as const : "low" as const,
                clause: risk.title_en || risk.title_th || risk.clause_ref || "Unspecified clause",
                description: risk.description_en || risk.description_th,
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
            setResults(mapped);
            setAnalysisSummary(response.summary_en || response.summary_th || "Analysis completed");
            setExplainByRiskId({});
            setExplainErrorByRiskId({});
            setSelectedRisk(mapped[0] ?? null);
            setFocusedPage(mapped[0]?.anchors?.[0]?.page ?? 1);
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "Risk analysis failed");
        } finally {
            setAnalyzing(false);
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
        const content = `NEOEM AI Risk Analysis Summary\n${"=".repeat(40)}\n\nGenerated: ${new Date().toLocaleDateString()}\nDocument: ${file?.name || "Contract"}\n\n${results.map((r, i) => (
            `${i + 1}. [${r.type.toUpperCase()}] ${r.clause}\n   Issue: ${r.description}\n   Page: ${r.page}\n`
        )).join("\n")}`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Risk_Summary_Report.txt";
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

    if (!results) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="max-w-md w-full p-6 space-y-6">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
                        <BadgeDollarSign className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">
                            Estimated Lawyer Cost Savings: ~฿{lawyerCostSaved.toLocaleString()}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-foreground text-center">Upload Contract to Check Risks</h2>

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
                                    <p className="text-foreground font-medium">Click to upload PDF or drag & drop</p>
                                    <p className="text-sm text-muted-foreground">Supports PDF, PNG, JPG</p>
                                </div>
                            )}
                        </div>
                    </label>

                    <Button onClick={handleAnalyze} disabled={!file || analyzing} className="w-full" size="lg">
                        {analyzing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing with OCR + Legal AI...</> : <><Search className="h-5 w-5 mr-2" /> Analyze Contract</>}
                    </Button>
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
                    <span className="text-sm font-medium text-foreground">Risk Results</span>
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

                    <div className="text-sm font-semibold text-foreground">Risk Summary</div>
                    <div className="flex gap-2">
                        <div className="flex-1 p-2.5 rounded-lg bg-destructive/10 text-center">
                            <div className="text-xl font-bold text-destructive">{highCount}</div>
                            <div className="text-[10px] text-muted-foreground">High</div>
                        </div>
                        <div className="flex-1 p-2.5 rounded-lg bg-warning/10 text-center">
                            <div className="text-xl font-bold text-warning">{mediumCount}</div>
                            <div className="text-[10px] text-muted-foreground">Medium</div>
                        </div>
                        <div className="flex-1 p-2.5 rounded-lg bg-success/10 text-center">
                            <div className="text-xl font-bold text-success">{lowCount}</div>
                            <div className="text-[10px] text-muted-foreground">Low</div>
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
                                            <p className="text-xs font-medium text-primary mb-1">Issue Context</p>
                                            <p className="text-xs text-muted-foreground">{risk.description}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs flex-1"
                                                    onClick={() => handleExplain(risk)}
                                                    disabled={explainLoadingId === risk.id}
                                                >
                                                    {explainLoadingId === risk.id ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Explaining...</> : "Explain"}
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-7 text-xs flex-1 text-primary border-primary/30">Ask Lawyer</Button>
                                            </div>
                                            {explainErrorByRiskId[risk.id] && (
                                                <p className="text-xs text-destructive mt-2">{explainErrorByRiskId[risk.id]}</p>
                                            )}
                                            {explainByRiskId[risk.id] && (
                                                <div className="mt-2 p-2.5 rounded-md border bg-secondary/20 space-y-2">
                                                    <p className="text-xs font-semibold text-foreground">AI Explanation</p>
                                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                                        {explainByRiskId[risk.id].explanation_en || explainByRiskId[risk.id].explanation_th}
                                                    </p>
                                                    {explainByRiskId[risk.id].business_impact.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-medium text-foreground mb-1">Business Impact</p>
                                                            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                                                                {explainByRiskId[risk.id].business_impact.map((item, idx) => (
                                                                    <li key={`${risk.id}-impact-${idx}`}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {explainByRiskId[risk.id].worst_case_scenario && (
                                                        <div>
                                                            <p className="text-xs font-medium text-foreground mb-1">Worst-case Scenario</p>
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
