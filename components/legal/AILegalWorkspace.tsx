import { useState, useEffect, useCallback } from "react";
import {
    FileText, Search, FolderClock, X, Upload, Loader2,
    AlertTriangle, CheckCircle2, XCircle, Download, Eye,
    BadgeDollarSign, Sparkles, ChevronRight, History, Info,
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
import {
    analyzeContractRisk,
    explainRisk,
    extractContext,
    generateDraft,
    finalizeContract,
    getContractDownloadUrl,
    type RiskCheckResponse,
    type RiskItemResult,
    type RiskExplainResponse,
    type ChatMessagePayload,
    type FactoryInfoPayload,
    type ContractArticle,
    type GenerateDraftResponse,
    type FinalizeResponse,
    type DealSheet,
} from "@/lib/ai-api";

interface AILegalWorkspaceProps {
    open: boolean;
    onClose: () => void;
    factoryName?: string;
    initialTab?: "draft" | "risk" | "history";
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

// Template ID mapping: frontend id → backend template_type
const TEMPLATE_MAP: Record<string, string> = {
    sales: "sales_contract",
    "hire-of-work": "hire_of_work",
    oem: "hybrid_oem",
    nda: "nda",
    distribution: "distribution",
};

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
    recommendation: string;
    // Keep original API fields for the explain endpoint
    title_th: string;
    title_en: string;
    description_th: string;
    description_en: string;
    recommendation_th: string;
    recommendation_en: string;
    clause_ref: string;
    level: string;
    category: string;
}

function mapRiskLevel(level: string): "high" | "medium" | "low" {
    if (level === "critical" || level === "high") return "high";
    if (level === "medium") return "medium";
    return "low";
}

function mapApiRisksToUI(risks: RiskItemResult[]): RiskItem[] {
    return risks.map((r, i) => ({
        id: r.risk_id,
        type: mapRiskLevel(r.level),
        clause: r.title_en || r.title_th,
        description: r.description_en || r.description_th,
        page: 1,
        recommendation: r.recommendation_en || r.recommendation_th,
        title_th: r.title_th,
        title_en: r.title_en,
        description_th: r.description_th,
        description_en: r.description_en,
        recommendation_th: r.recommendation_th,
        recommendation_en: r.recommendation_en,
        clause_ref: r.clause_ref || "",
        level: r.level,
        category: r.category,
    }));
}

const mockHistory = [
    { id: "h1", fileName: "Contract_SkincarePlus_v2.pdf", date: "2025-01-15", version: "V2", riskLevel: "medium" as const, risksCount: 3 },
    { id: "h2", fileName: "Contract_SkincarePlus_v1.pdf", date: "2025-01-10", version: "V1", riskLevel: "high" as const, risksCount: 5 },
    { id: "h3", fileName: "MOU_BeautyFactory.pdf", date: "2024-12-20", version: "V1", riskLevel: "low" as const, risksCount: 1 },
];

const auditors = [
    { name: "Katun Thangho", role: "Brand Launchpad" },
    { name: "Canal Wiata", role: "Revili Locontam" },
    { name: "Resena Don", role: "Reviti Locontam" },
];

export function AILegalWorkspace({ open, onClose, factoryName = "Factory", initialTab = "draft", chatHistory = [], factoryInfo }: AILegalWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<"draft" | "risk" | "history">(initialTab);

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
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                        <History className="h-3.5 w-3.5" /> History ({mockHistory.length})
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
                    {activeTab === "history" && <HistoryPanel />}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// DRAFT PANEL
// ══════════════════════════════════════════════════
function DraftPanel({ factoryName, chatHistory = [], factoryInfo }: { factoryName: string; chatHistory?: ChatMessagePayload[]; factoryInfo?: FactoryInfoPayload }) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draftResponse, setDraftResponse] = useState<GenerateDraftResponse | null>(null);
    const [finalizeResult, setFinalizeResult] = useState<FinalizeResponse | null>(null);
    const [suggestedTemplate, setSuggestedTemplate] = useState<string | null>(null);
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

    // Auto-fill from chat on mount if chat history exists
    useEffect(() => {
        if (chatHistory.length === 0) return;
        let cancelled = false;
        (async () => {
            try {
                const ctx = await extractContext(chatHistory, factoryName, factoryInfo?.factory_id);
                if (cancelled) return;
                const ds = ctx.deal_sheet;
                // Map suggested template back to frontend ID
                const backToFrontend: Record<string, string> = {
                    sales_contract: "sales",
                    hire_of_work: "hire-of-work",
                    hybrid_oem: "oem",
                    nda: "nda",
                    distribution: "distribution",
                };
                setSuggestedTemplate(backToFrontend[ctx.suggested_template] || null);
                // Normalize ip_ownership from LLM to valid backend enum values
                const ipMap: Record<string, string> = { buyer: "buyer", factory: "factory", shared: "shared", custom: "custom", seller: "factory", joint: "shared" };
                const rawIp = ds.commercial_terms?.ip_ownership || "";
                const safeIp = ipMap[rawIp] || undefined;
                setFormData((prev) => ({
                    ...prev,
                    buyerName: ds.client?.name || prev.buyerName,
                    sellerName: ds.vendor?.name || prev.sellerName,
                    productType: ds.product?.name || prev.productType,
                    productSpec: ds.product?.specs || prev.productSpec,
                    quantity: ds.product?.quantity?.toString() || prev.quantity,
                    totalPrice: ds.total_price?.toString() || prev.totalPrice,
                    deliveryDate: ds.delivery_date || prev.deliveryDate,
                    ipOwnership: safeIp || prev.ipOwnership,
                }));
            } catch {
                // Silently fall back to defaults if extraction fails
            }
        })();
        return () => { cancelled = true; };
    }, [chatHistory, factoryName, factoryInfo?.factory_id]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const templateType = TEMPLATE_MAP[formData.template] || "sales_contract";
            const dealSheet: DealSheet = {
                vendor: { name: formData.sellerName, role: "seller" },
                client: { name: formData.buyerName, role: "buyer" },
                product: {
                    name: formData.productType,
                    specs: formData.productSpec || undefined,
                    quantity: parseInt(formData.quantity) || undefined,
                },
                total_price: parseFloat(formData.totalPrice) || undefined,
                delivery_date: formData.deliveryDate || undefined,
                commercial_terms: {
                    ip_ownership: formData.ipOwnership,
                    penalty_type: formData.penaltyClause === "none" ? "none" : "percentage_daily",
                    penalty_details: formData.penaltyClause !== "none" ? `${formData.penaltyClause}% per day` : undefined,
                },
                additional_notes: formData.additionalClauses || undefined,
            };
            const result = await generateDraft({
                template_type: templateType,
                deal_sheet: dealSheet,
                parties: [
                    { name: formData.buyerName, role: "buyer" },
                    { name: formData.sellerName, role: "seller" },
                ],
                product: {
                    name: formData.productType,
                    specs: formData.productSpec || undefined,
                    quantity: parseInt(formData.quantity) || undefined,
                },
                total_price: parseFloat(formData.totalPrice) || undefined,
                delivery_date: formData.deliveryDate || undefined,
                commercial_terms: {
                    ip_ownership: formData.ipOwnership,
                    penalty_type: formData.penaltyClause === "none" ? "none" : "percentage_daily",
                    penalty_details: formData.penaltyClause !== "none" ? `${formData.penaltyClause}% per day` : undefined,
                },
            });
            setDraftResponse(result);
            setStep(3);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Draft generation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!draftResponse) return;
        setLoading(true);
        setError(null);
        try {
            const result = await finalizeContract({
                contract_title: draftResponse.contract_title,
                articles: draftResponse.articles,
                preamble_th: draftResponse.preamble_th,
                effective_date: draftResponse.effective_date || undefined,
                parties: [
                    { name: formData.buyerName, role: "buyer" },
                    { name: formData.sellerName, role: "seller" },
                ],
            });
            setFinalizeResult(result);
            setStep(4);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Finalization failed");
        } finally {
            setLoading(false);
        }
    };

    const autoFillClass = "border-primary/30 bg-primary/5";

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* AI Recommendation */}
            {suggestedTemplate && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">
                        💡 Based on your chat, we recommend: <span className="font-semibold text-primary">{templates.find((t) => t.id === suggestedTemplate)?.label || "Contract"}</span>
                    </p>
                </div>
            )}
            {!suggestedTemplate && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">
                        💡 Select a template to start drafting your contract
                    </p>
                </div>
            )}

            {error && (
                <div className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                    {error}
                </div>
            )}

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

            {/* Step 1 */}
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

            {/* Step 2 */}
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
                                    <SelectItem value="factory">Seller (Manufacturer)</SelectItem>
                                    <SelectItem value="shared">Joint Ownership</SelectItem>
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

            {/* Step 3 */}
            {step === 3 && draftResponse && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Review Draft</h2>
                    <Card className="bg-secondary/20">
                        <CardContent className="p-6 space-y-4 text-sm">
                            <div className="text-center border-b pb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                                    {draftResponse.contract_title}
                                </p>
                            </div>
                            {draftResponse.preamble_th && (
                                <p className="text-muted-foreground">{draftResponse.preamble_th}</p>
                            )}
                            {draftResponse.articles.map((article) => (
                                <div key={article.article_number} className="space-y-1">
                                    <p className="font-semibold text-foreground">
                                        ข้อ {article.article_number}: {article.title_th}
                                    </p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{article.body_th}</p>
                                </div>
                            ))}
                            {draftResponse.effective_date && (
                                <p className="text-muted-foreground">
                                    <strong className="text-foreground">Effective Date:</strong> {draftResponse.effective_date}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Edit Details</Button>
                        <Button onClick={handleFinalize} disabled={loading} className="flex-1">
                            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finalizing...</> : "Confirm & Download"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 4 */}
            {step === 4 && finalizeResult && (
                <div className="space-y-4 text-center py-8">
                    <div className="p-8 bg-success/5 border border-success/20 rounded-xl space-y-3 max-w-sm mx-auto">
                        <FileText className="h-14 w-14 text-success mx-auto" />
                        <p className="font-semibold text-foreground text-lg">{finalizeResult.message_en}</p>
                        <p className="text-sm text-muted-foreground">{finalizeResult.message_th}</p>
                    </div>
                    <div className="flex gap-3 max-w-sm mx-auto">
                        {finalizeResult.pdf_url && (
                            <Button className="w-full flex-1" size="lg" onClick={() => {
                                window.location.href = finalizeResult.pdf_url!.replace("/api/", "/api/ai/");
                            }}>
                                <Download className="h-5 w-5 mr-2" /> PDF
                            </Button>
                        )}
                        {finalizeResult.docx_url && (
                            <Button variant="outline" className="w-full flex-1" size="lg" onClick={() => {
                                window.location.href = finalizeResult.docx_url!.replace("/api/", "/api/ai/");
                            }}>
                                <Download className="h-5 w-5 mr-2" /> Word
                            </Button>
                        )}
                    </div>
                    <Button variant="ghost" onClick={() => { setStep(1); setDraftResponse(null); setFinalizeResult(null); }} className="mt-2">
                        Draft Another Contract
                    </Button>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════
// RISK PANEL (Split-Screen 60:40) — with PDF viewer
// ══════════════════════════════════════════════════
function RiskPanel({ chatHistory = [], factoryInfo }: { chatHistory?: ChatMessagePayload[]; factoryInfo?: FactoryInfoPayload }) {
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<RiskItem[] | null>(null);
    const [overallRisk, setOverallRisk] = useState<string>("medium");
    const [riskScore, setRiskScore] = useState<number>(0);
    const [summaryTh, setSummaryTh] = useState<string>("");
    const [summaryEn, setSummaryEn] = useState<string>("");
    const [processingTime, setProcessingTime] = useState<number>(0);
    const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [explaining, setExplaining] = useState<string | null>(null); // risk_id being explained
    const [explanations, setExplanations] = useState<Record<string, RiskExplainResponse>>({});
    const lawyerCostSaved = 15000;

    const handleDownloadFile = useCallback(() => {
        if (!file || !fileUrl) return;
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = file.name;
        a.click();
    }, [file, fileUrl]);

    const handleExplain = useCallback(async (risk: RiskItem) => {
        if (explanations[risk.id]) return; // already fetched
        setExplaining(risk.id);
        try {
            const result = await explainRisk({
                risk_id: risk.id,
                title_th: risk.title_th,
                title_en: risk.title_en,
                level: risk.level,
                clause_ref: risk.clause_ref,
                description_th: risk.description_th,
                description_en: risk.description_en,
                recommendation_th: risk.recommendation_th,
                recommendation_en: risk.recommendation_en,
                category: risk.category,
            });
            setExplanations((prev) => ({ ...prev, [risk.id]: result }));
        } catch {
            // silently fail — user can retry
        } finally {
            setExplaining(null);
        }
    }, [explanations]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            setFileUrl(URL.createObjectURL(f));
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setError(null);
        try {
            const response: RiskCheckResponse = await analyzeContractRisk(
                file,
                chatHistory,
                factoryInfo,
            );
            setResults(mapApiRisksToUI(response.risks));
            setOverallRisk(response.overall_risk);
            setRiskScore(response.risk_score);
            setSummaryTh(response.summary_th);
            setSummaryEn(response.summary_en);
            setProcessingTime(response.processing_time_seconds);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setAnalyzing(false);
        }
    };

    const getRiskIcon = (type: RiskItem["type"]) => {
        switch (type) {
            case "high": return <XCircle className="h-4 w-4 text-destructive" />;
            case "medium": return <AlertTriangle className="h-4 w-4 text-warning" />;
            case "low": return <CheckCircle2 className="h-4 w-4 text-success" />;
        }
    };

    const getRiskBorderColor = (type: RiskItem["type"]) => {
        switch (type) {
            case "high": return "border-destructive";
            case "medium": return "border-warning";
            case "low": return "border-success";
        }
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
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
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
                                    <p className="text-sm text-muted-foreground">Supports PDF, DOC, DOCX</p>
                                </div>
                            )}
                        </div>
                    </label>

                    <Button onClick={handleAnalyze} disabled={!file || analyzing} className="w-full" size="lg">
                        {analyzing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analyzing with OCR + Legal AI...</> : <><Search className="h-5 w-5 mr-2" /> Analyze Contract</>}
                    </Button>

                    {error && (
                        <div className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Results: Split-screen 60:40 — PDF viewer on left
    return (
        <div className="flex h-full">
            {/* Left: PDF Viewer (60%) */}
            <div className="w-[60%] border-r flex flex-col">
                <div className="h-10 border-b flex items-center justify-between px-4 bg-card flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4" />
                        <span className="text-foreground font-medium">Document Preview</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleDownloadFile}><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
                </div>
                <div className="flex-1 overflow-hidden bg-secondary/10">
                    {/* Embedded PDF viewer using the uploaded file */}
                    {fileUrl ? (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full border-0"
                            title="Contract PDF Viewer"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            No document loaded
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Risk Analysis (40%) */}
            <div className="w-[40%] flex flex-col">
                <div className="h-10 border-b flex items-center justify-between px-4 bg-card flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">Contract Risk Check - Results</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setResults(null); setFile(null); setFileUrl(null); setError(null); }}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Cost saving */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
                        <BadgeDollarSign className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-xs font-medium text-success">Estimated Lawyer Cost Savings: ~฿{lawyerCostSaved.toLocaleString()}</span>
                    </div>

                    {/* Risk Summary */}
                    <div className="text-sm font-semibold text-foreground">Risk Summary (Score: {riskScore}/100)</div>
                    <div className="flex gap-2">
                        <div className="flex-1 p-2.5 rounded-lg bg-destructive/10 text-center">
                            <div className="text-xl font-bold text-destructive">{highCount}</div>
                            <div className="text-[10px] text-muted-foreground">High Risk</div>
                        </div>
                        <div className="flex-1 p-2.5 rounded-lg bg-warning/10 text-center">
                            <div className="text-xl font-bold text-warning">{mediumCount}</div>
                            <div className="text-[10px] text-muted-foreground">Medium Risk</div>
                        </div>
                        <div className="flex-1 p-2.5 rounded-lg bg-success/10 text-center">
                            <div className="text-xl font-bold text-success">{lowCount}</div>
                            <div className="text-[10px] text-muted-foreground">Low Risk</div>
                        </div>
                    </div>

                    {/* AI Summary */}
                    {(summaryTh || summaryEn) && (
                        <div className="p-3 rounded-lg bg-secondary/30 text-sm space-y-1">
                            {summaryTh && <p className="text-muted-foreground">{summaryTh}</p>}
                            {summaryEn && <p className="text-muted-foreground text-xs">{summaryEn}</p>}
                            <p className="text-[10px] text-muted-foreground">Analyzed in {processingTime}s</p>
                        </div>
                    )}

                    {/* Risk Cards */}
                    <div className="space-y-3">
                        {results.map((risk, i) => (
                            <Card
                                key={risk.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedRisk?.id === risk.id ? "ring-2 ring-primary" : ""
                                    } ${getRiskBgColor(risk.type)} border-${risk.type === "high" ? "destructive" : risk.type === "medium" ? "warning" : "success"}/30`}
                                onClick={() => setSelectedRisk(risk)}
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
                                        <div className="mt-2 space-y-2">
                                            <div className="p-2.5 bg-card rounded-lg border">
                                                <p className="text-xs font-medium text-primary mb-1">💡 Recommendation:</p>
                                                <p className="text-xs text-muted-foreground">{risk.recommendation}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs flex-1"
                                                        disabled={explaining === risk.id}
                                                        onClick={(e) => { e.stopPropagation(); handleExplain(risk); }}
                                                    >
                                                        {explaining === risk.id ? (
                                                            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Explaining...</>
                                                        ) : explanations[risk.id] ? (
                                                            <><Info className="h-3 w-3 mr-1" /> Explained</>
                                                        ) : (
                                                            <><Info className="h-3 w-3 mr-1" /> Explain</>
                                                        )}
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 text-primary border-primary/30">Ask Lawyer</Button>
                                                </div>
                                            </div>
                                            {explanations[risk.id] && (
                                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                                                    <p className="text-xs font-semibold text-primary flex items-center gap-1"><Info className="h-3 w-3" /> AI Explanation</p>
                                                    {explanations[risk.id].explanation_en && (
                                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{explanations[risk.id].explanation_en}</p>
                                                    )}
                                                    {explanations[risk.id].business_impact.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-medium text-foreground mt-1">Business Impact:</p>
                                                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                                                                {explanations[risk.id].business_impact.map((impact, idx) => (
                                                                    <li key={idx}>{impact}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {explanations[risk.id].worst_case_scenario && (
                                                        <div>
                                                            <p className="text-xs font-medium text-destructive mt-1">⚠ Worst Case:</p>
                                                            <p className="text-xs text-muted-foreground">{explanations[risk.id].worst_case_scenario}</p>
                                                        </div>
                                                    )}
                                                    {explanations[risk.id].suggested_fix && (
                                                        <div>
                                                            <p className="text-xs font-medium text-success mt-1">✅ Suggested Fix:</p>
                                                            <p className="text-xs text-muted-foreground">{explanations[risk.id].suggested_fix}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Auditor section */}
                    <div className="pt-2">
                        <p className="text-sm font-semibold text-foreground mb-2">Auditor</p>
                        <div className="space-y-2">
                            {auditors.map((a) => (
                                <div key={a.name} className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {a.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-foreground">{a.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{a.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={() => { setResults(null); setFile(null); setFileUrl(null); setError(null); }}>
                        Analyze Another Document
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// HISTORY PANEL
// ══════════════════════════════════════════════════
function HistoryPanel() {
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Legal Hub — Contract History</h2>
            <p className="text-sm text-muted-foreground">All your drafted and reviewed contracts in one place.</p>

            <div className="space-y-3">
                {mockHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors bg-card">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${entry.riskLevel === "high" ? "bg-destructive" : entry.riskLevel === "medium" ? "bg-warning" : "bg-success"
                                }`} />
                            <div>
                                <p className="text-sm font-medium text-foreground">{entry.fileName}</p>
                                <p className="text-xs text-muted-foreground">{entry.date} · {entry.risksCount} risks found</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{entry.version}</Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
                Compare versions to track how risks change after negotiation
            </p>
        </div>
    );
}
