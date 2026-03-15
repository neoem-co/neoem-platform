import { useState } from "react";
import { FileText, Send, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MilestonePayment {
    label: string;
    percentage: number;
}

interface OEMQuotationInlineProps {
    onSendProposal: (proposal: { price: string; milestones: MilestonePayment[] }) => void;
    tier: "free" | "pro" | "premium";
    aiUsageCount: number;
    aiUsageLimit: number;
}

export function OEMQuotationInline({ onSendProposal, tier, aiUsageCount, aiUsageLimit }: OEMQuotationInlineProps) {
    const [price, setPrice] = useState("");
    const [milestones, setMilestones] = useState<MilestonePayment[]>([
        { label: "Deposit", percentage: 30 },
        { label: "Production", percentage: 40 },
        { label: "Delivery", percentage: 30 },
    ]);

    const updateMilestone = (index: number, field: keyof MilestonePayment, value: string | number) => {
        setMilestones((prev) =>
            prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
        );
    };

    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);
    const isUnlimited = tier === "premium";
    const canUseAI = isUnlimited || aiUsageCount < aiUsageLimit;

    return (
        <Card className="border-primary/20">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Quotation & Milestones
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
                {/* Price */}
                <div className="space-y-1">
                    <Label className="text-xs">Total Price (฿)</Label>
                    <Input
                        type="number"
                        placeholder="e.g., 120000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>

                {/* Milestones */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Payment Milestones</Label>
                    {milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={m.label}
                                onChange={(e) => updateMilestone(i, "label", e.target.value)}
                                className="h-7 text-xs flex-1"
                            />
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    value={m.percentage}
                                    onChange={(e) => updateMilestone(i, "percentage", Number(e.target.value))}
                                    className="h-7 text-xs w-16 text-center"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                            </div>
                        </div>
                    ))}
                    {totalPercentage !== 100 && (
                        <p className="text-[10px] text-destructive">Total must equal 100% (currently {totalPercentage}%)</p>
                    )}
                </div>

                {/* Send Proposal */}
                <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    disabled={!price || totalPercentage !== 100}
                    onClick={() => onSendProposal({ price, milestones })}
                >
                    <Send className="h-3.5 w-3.5 mr-1" /> Send Proposal to Chat
                </Button>

                {/* AI Quotation */}
                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-foreground">AI Quotation</span>
                        {!isUnlimited && (
                            <Badge variant="outline" className="text-[10px]">
                                {aiUsageCount}/{aiUsageLimit} used
                            </Badge>
                        )}
                        {isUnlimited && (
                            <Badge variant="outline" className="text-[10px] text-success border-success/30">Unlimited</Badge>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        disabled={!canUseAI}
                        onClick={() => {/* would navigate to dashboard AI quotation */ }}
                    >
                        {canUseAI ? (
                            <><Sparkles className="h-3.5 w-3.5 mr-1" /> Generate AI Quotation PDF</>
                        ) : (
                            <><Lock className="h-3.5 w-3.5 mr-1" /> Upgrade to Use More</>
                        )}
                    </Button>
                </div>

                {/* AI Legal Tools Quota */}
                <div className="pt-2 border-t space-y-1.5">
                    <span className="text-xs font-medium text-foreground">AI Legal Tools</span>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Draft Contract</span>
                        {isUnlimited ? (
                            <span className="text-success">Unlimited</span>
                        ) : (
                            <span className="text-muted-foreground">{aiUsageCount}/{aiUsageLimit}</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Check Risk</span>
                        {isUnlimited ? (
                            <span className="text-success">Unlimited</span>
                        ) : (
                            <span className="text-muted-foreground">{aiUsageCount}/{aiUsageLimit}</span>
                        )}
                    </div>
                    {tier === "free" && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                            🔒 Upgrade to Pro for 5 uses/month or Premium for unlimited.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}