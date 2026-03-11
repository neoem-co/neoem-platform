import { useState } from "react";
import {
    MessageSquare, Handshake, FileText, Search, PenTool,
    CreditCard, Factory, DollarSign, CheckCircle2, Rocket,
    ChevronDown, ChevronUp, Shield, Info, SkipForward, Eye,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type MilestoneStatus = "completed" | "active" | "upcoming" | "skipped";

export interface Milestone {
    id: string;
    step: number;
    label: string;
    status: MilestoneStatus;
    ctaLabel?: string;
    ctaAction?: string;
    skippable?: boolean;
    tooltip?: string;
    hasDocument?: boolean;
}

const defaultMilestones: Milestone[] = [
    { id: "m1", step: 1, label: "Initial Chat", status: "completed", tooltip: "Begin conversation with the factory to discuss your product requirements." },
    { id: "m2", step: 2, label: "Deal Agreement", status: "completed", tooltip: "Agree on product specifications, pricing, and delivery timeline." },
    { id: "m3", step: 3, label: "Contract Drafting", status: "active", ctaLabel: "📝 Draft Contract via AI", ctaAction: "draft", skippable: true, tooltip: "Use AI to generate a legally-binding contract based on your deal terms." },
    { id: "m4", step: 4, label: "Risk Checking", status: "upcoming", ctaLabel: "🔍 Check AI Risks", ctaAction: "risk", skippable: true, tooltip: "AI scans the contract for legal loopholes, missing clauses, and unfair terms." },
    { id: "m5", step: 5, label: "Sign Contract", status: "upcoming", ctaLabel: "✍️ E-Signature", ctaAction: "esign", skippable: true, tooltip: "Sign the contract digitally using the in-platform E-Signature feature." },
    { id: "m6", step: 6, label: "1st Payment (Deposit)", status: "upcoming", ctaLabel: "💳 Pay via Escrow", ctaAction: "pay-1", tooltip: "Pay the initial deposit. Funds are held securely in escrow until you approve." },
    { id: "m7", step: 7, label: "Start Production", status: "upcoming", tooltip: "Factory begins manufacturing your product." },
    { id: "m8", step: 8, label: "2nd Payment & Review", status: "upcoming", ctaLabel: "💳 Pay via Escrow", ctaAction: "pay-2", tooltip: "Review production progress and release the second installment." },
    { id: "m9", step: 9, label: "3rd Payment & Review", status: "upcoming", ctaLabel: "💳 Pay via Escrow", ctaAction: "pay-3", tooltip: "Final payment after quality check approval." },
    { id: "m10", step: 10, label: "Quality Control (QC)", status: "upcoming", tooltip: "Inspect product quality before shipment." },
    { id: "m11", step: 11, label: "Deal Closed", status: "upcoming", tooltip: "All payments released. Deal is complete." },
    { id: "m12", step: 12, label: "Brand Launchpad", status: "upcoming", ctaLabel: "🚀 Go to Brand Launchpad", ctaAction: "launchpad", tooltip: "Launch your brand with marketing guides, resources, and expert networking." },
];

const milestoneIcons: Record<number, React.ElementType> = {
    1: MessageSquare, 2: Handshake, 3: FileText, 4: Search,
    5: PenTool, 6: CreditCard, 7: Factory, 8: DollarSign,
    9: DollarSign, 10: CheckCircle2, 11: CheckCircle2, 12: Rocket,
};

interface MilestoneTrackerProps {
    onAction: (action: string) => void;
}

export function MilestoneTracker({ onAction }: MilestoneTrackerProps) {
    const [milestones, setMilestones] = useState<Milestone[]>(defaultMilestones);
    const [expanded, setExpanded] = useState(true);

    const completed = milestones.filter((m) => m.status === "completed").length;
    const progress = (completed / milestones.length) * 100;

    const handleSkip = (id: string) => {
        setMilestones((prev) => {
            const idx = prev.findIndex((m) => m.id === id);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], status: "skipped" };
            if (idx + 1 < updated.length && updated[idx + 1].status === "upcoming") {
                updated[idx + 1] = { ...updated[idx + 1], status: "active" };
            }
            return updated;
        });
    };

    const handleComplete = (id: string) => {
        setMilestones((prev) => {
            const idx = prev.findIndex((m) => m.id === id);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], status: "completed", hasDocument: true };
            if (idx + 1 < updated.length && updated[idx + 1].status === "upcoming") {
                updated[idx + 1] = { ...updated[idx + 1], status: "active" };
            }
            return updated;
        });
    };

    const getStatusColor = (status: MilestoneStatus) => {
        switch (status) {
            case "completed": return "bg-success text-success-foreground";
            case "active": return "bg-primary text-primary-foreground ring-2 ring-primary/30";
            case "skipped": return "bg-muted text-muted-foreground line-through";
            case "upcoming": return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Deal Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{completed}/{milestones.length}</span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </button>

            <Progress value={progress} className="h-1.5" />

            {expanded && (
                <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                    {milestones.map((milestone) => (
                        <div
                            key={milestone.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${milestone.status === "active" ? "bg-primary/5" : ""
                                }`}
                        >
                            {/* Step indicator */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${getStatusColor(milestone.status)}`}>
                                {milestone.status === "completed" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : milestone.status === "skipped" ? (
                                    <SkipForward className="h-3 w-3" />
                                ) : (
                                    milestone.step
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className={`text-xs font-medium ${milestone.status === "active" ? "text-foreground" :
                                        milestone.status === "completed" ? "text-muted-foreground line-through" :
                                            milestone.status === "skipped" ? "text-muted-foreground line-through italic" :
                                                "text-muted-foreground"
                                        }`}>
                                        {milestone.label}
                                    </p>

                                    {/* Tooltip info icon */}
                                    {milestone.tooltip && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                                                        <Info className="h-3 w-3" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="max-w-[200px] text-xs">
                                                    {milestone.tooltip}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    {milestone.status === "skipped" && (
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 text-muted-foreground border-muted">
                                            Skipped
                                        </Badge>
                                    )}
                                </div>

                                {/* CTA for active steps */}
                                {milestone.status === "active" && milestone.ctaLabel && (
                                    <Button
                                        size="sm"
                                        className="h-7 text-[11px] mt-1 w-full justify-start"
                                        onClick={() => {
                                            if (milestone.ctaAction) onAction(milestone.ctaAction);
                                        }}
                                    >
                                        {milestone.ctaLabel}
                                    </Button>
                                )}

                                {/* Skip & Complete for skippable active steps */}
                                {milestone.status === "active" && milestone.skippable && (
                                    <div className="flex gap-1.5 mt-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] text-muted-foreground px-2"
                                            onClick={() => handleSkip(milestone.id)}
                                        >
                                            <SkipForward className="h-3 w-3 mr-0.5" /> Skip
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] text-success px-2"
                                            onClick={() => handleComplete(milestone.id)}
                                        >
                                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> Mark Done
                                        </Button>
                                    </div>
                                )}

                                {/* Document preview for completed (not skipped) steps that have documents */}
                                {milestone.status === "completed" && milestone.hasDocument && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px] mt-1 px-2"
                                        onClick={() => {
                                            if (milestone.ctaAction) onAction(`preview-${milestone.ctaAction}`);
                                        }}
                                    >
                                        <Eye className="h-3 w-3 mr-0.5" /> Preview
                                    </Button>
                                )}

                                {milestone.status === "active" && (
                                    <Badge variant="outline" className="text-[10px] mt-1 text-primary border-primary/30">
                                        Current Step
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
