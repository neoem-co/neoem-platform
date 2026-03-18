import { useState, useEffect } from "react";
import { FileText, Sparkles, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    downloadFile,
    generateDraft,
    finalizeContract,
    type DealSheet,
    type FinalizeResponse,
} from "@/lib/ai-api";

interface ContractDraftingFormProps {
    factoryName: string;
    onGenerate: (contract: ContractData) => void;
    onClose: () => void;
    initialData?: ContractData | null;
}

interface ContractData {
    productType: string;
    quantity: string;
    totalPrice: string;
    deliveryDate: string;
    penaltyClause: string;
    paymentTerms: string;
    qualityStandards: string;
    warrantyPeriod: string;
    additionalClauses: string;
}

export function ContractDraftingForm({ factoryName, onGenerate, onClose, initialData }: ContractDraftingFormProps) {
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [finalizeResult, setFinalizeResult] = useState<FinalizeResponse | null>(null);
    const [formData, setFormData] = useState<ContractData>({
        productType: "Sunscreen SPF50 Mousse",
        quantity: "1000",
        totalPrice: "120000",
        deliveryDate: "",
        penaltyClause: "0.1",
        paymentTerms: "30-40-30",
        qualityStandards: "",
        warrantyPeriod: "30",
        additionalClauses: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const dealSheet: DealSheet = {
                vendor: { name: factoryName, role: "seller" },
                client: { name: "Your Company", role: "buyer" },
                product: {
                    name: formData.productType,
                    quantity: parseInt(formData.quantity) || undefined,
                },
                total_price: parseFloat(formData.totalPrice) || undefined,
                delivery_date: formData.deliveryDate || undefined,
                commercial_terms: {
                    ip_ownership: "buyer",
                    penalty_type: formData.penaltyClause === "none" ? "none" : "percentage_daily",
                    penalty_details: formData.penaltyClause !== "none" ? `${formData.penaltyClause}% per day` : undefined,
                },
                additional_notes: formData.additionalClauses || undefined,
            };
            const draftResult = await generateDraft({
                template_type: "hire_of_work",
                deal_sheet: dealSheet,
                parties: [
                    { name: "Your Company", role: "buyer" },
                    { name: factoryName, role: "seller" },
                ],
                product: { name: formData.productType, quantity: parseInt(formData.quantity) || undefined },
                total_price: parseFloat(formData.totalPrice) || undefined,
                delivery_date: formData.deliveryDate || undefined,
            });
            // Finalize immediately for this simpler form
            const result = await finalizeContract({
                contract_title: draftResult.contract_title,
                articles: draftResult.articles,
                preamble_th: draftResult.preamble_th,
                effective_date: draftResult.effective_date || undefined,
                parties: [
                    { name: "Your Company", role: "buyer" },
                    { name: factoryName, role: "seller" },
                ],
            });
            setFinalizeResult(result);
            setGenerated(true);
            onGenerate(formData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Generation failed");
        } finally {
            setLoading(false);
        }
    };

    if (generated) {
        return (
            <Card className="border-success/30">
                <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4 text-success" />
                            Contract Generated
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => { setGenerated(false); onClose(); }}>
                            Close
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="p-4 bg-success/5 border border-success/20 rounded-lg text-center space-y-2">
                        <FileText className="h-8 w-8 text-success mx-auto" />
                        <p className="font-medium text-foreground">{finalizeResult?.message_en || "Contract Generated"}</p>
                        <p className="text-xs text-muted-foreground">{finalizeResult?.message_th || "Generated just now"}</p>
                    </div>
                    {finalizeResult?.pdf_url && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            size="sm"
                            onClick={() => downloadFile(finalizeResult.pdf_url!, `${finalizeResult.contract_id}.pdf`)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Contract PDF
                        </Button>
                    )}
                    {finalizeResult?.docx_url && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            size="sm"
                            onClick={() => downloadFile(finalizeResult.docx_url!, `${finalizeResult.contract_id}.docx`)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Contract Word
                        </Button>
                    )}
                    {!finalizeResult && (
                        <Button variant="outline" className="w-full" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Contract PDF
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/30">
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {initialData ? "Edit Contract" : "Draft New Contract"}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Auto-fill document style */}
                <div className="border rounded-lg p-4 bg-secondary/20 space-y-1 text-sm">
                    <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Manufacturing Agreement</p>
                    <p className="text-muted-foreground">
                        This agreement is entered into between <span className="font-medium text-foreground">Your Company</span> (Buyer)
                        and <span className="font-medium text-primary">{factoryName}</span> (Manufacturer).
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Product Type <span className="text-destructive">*</span></Label>
                    <Input
                        value={formData.productType}
                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                        placeholder="e.g., Cream, Serum, Lotion"
                        className="border-primary/30 bg-primary/5 focus:bg-background"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Quantity <span className="text-destructive">*</span></Label>
                        <Input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            placeholder="1000"
                            className="border-primary/30 bg-primary/5 focus:bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Total Price (฿) <span className="text-destructive">*</span></Label>
                        <Input
                            type="number"
                            value={formData.totalPrice}
                            onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                            placeholder="120000"
                            className="border-primary/30 bg-primary/5 focus:bg-background"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Delivery Date <span className="text-destructive">*</span></Label>
                        <Input
                            type="date"
                            value={formData.deliveryDate}
                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            className="border-primary/30 bg-primary/5 focus:bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Warranty (days)</Label>
                        <Input
                            type="number"
                            value={formData.warrantyPeriod}
                            onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })}
                            placeholder="30"
                            className="border-primary/30 bg-primary/5 focus:bg-background"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Penalty Clause</Label>
                        <Select
                            value={formData.penaltyClause}
                            onValueChange={(value) => setFormData({ ...formData, penaltyClause: value })}
                        >
                            <SelectTrigger className="border-primary/30 bg-primary/5">
                                <SelectValue placeholder="Select penalty clause" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="0.1">0.1% per day late</SelectItem>
                                <SelectItem value="1">1% per day late</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Terms</Label>
                        <Select
                            value={formData.paymentTerms}
                            onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                        >
                            <SelectTrigger className="border-primary/30 bg-primary/5">
                                <SelectValue placeholder="Payment terms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30-40-30">30-40-30 Milestone</SelectItem>
                                <SelectItem value="50-50">50-50 Split</SelectItem>
                                <SelectItem value="100-upfront">100% Upfront</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Quality Standards</Label>
                    <Textarea
                        value={formData.qualityStandards}
                        onChange={(e) => setFormData({ ...formData, qualityStandards: e.target.value })}
                        placeholder="e.g., ISO 9001, GMP certified, specific testing requirements..."
                        className="border-primary/30 bg-primary/5 focus:bg-background"
                        rows={2}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Additional Clauses</Label>
                    <Textarea
                        value={formData.additionalClauses}
                        onChange={(e) => setFormData({ ...formData, additionalClauses: e.target.value })}
                        placeholder="Any special terms, conditions, or requirements..."
                        className="border-primary/30 bg-primary/5 focus:bg-background"
                        rows={2}
                    />
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating with AI...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {initialData ? "Update Contract" : "Generate Contract"}
                        </>
                    )}
                </Button>

                {error && (
                    <p className="text-xs text-destructive text-center">{error}</p>
                )}
            </CardContent>
        </Card>
    );
}
