import { AlertTriangle, FileWarning, FileSearch, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ContractWarningModalProps {
    open: boolean;
    onClose: () => void;
    onSkip: () => void;
    onReview: () => void;
    riskLevel?: "critical" | "high" | "medium" | "low" | "safe" | null;
    riskSummary?: string | null;
}

export function ContractWarningModal({ open, onClose, onSkip, onReview, riskLevel, riskSummary }: ContractWarningModalProps) {
    const isHighRisk = riskLevel === "critical" || riskLevel === "high";

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isHighRisk ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                            <FileWarning className="h-5 w-5 text-warning" />
                        )}
                        {isHighRisk ? "High-Risk Contract Detected" : "Review Contract before Payment?"}
                    </DialogTitle>
                    <DialogDescription>
                        {isHighRisk
                            ? "Our AI review found high-risk issues. Please resolve them before releasing payment."
                            : "This deal includes a legal contract. We recommend using our AI Reviewer to check for risks."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className={`p-4 rounded-lg ${isHighRisk ? "bg-destructive/10" : "bg-warning/10"}`}>
                        {riskSummary && (
                            <p className={`text-sm mb-3 ${isHighRisk ? "text-destructive" : "text-foreground"}`}>
                                {riskSummary}
                            </p>
                        )}
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li className="flex items-start gap-2">
                                <span className={isHighRisk ? "text-destructive" : "text-warning"}>•</span>
                                {isHighRisk ? "Critical clauses need attention before money is released" : "AI can identify risky clauses and missing protections"}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={isHighRisk ? "text-destructive" : "text-warning"}>•</span>
                                {isHighRisk ? "Review the AI recommendations and update unfair terms" : "Get recommendations for better terms"}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={isHighRisk ? "text-destructive" : "text-warning"}>•</span>
                                {isHighRisk ? "You can still proceed, but the deal will carry unresolved legal risk" : "Takes less than 30 seconds"}
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={onReview} className="w-full">
                            <FileSearch className="h-4 w-4 mr-2" />
                            {isHighRisk ? "Review High-Risk Issues" : "Review Contract with AI"}
                        </Button>
                        <Button variant="outline" onClick={onSkip} className="w-full">
                            <CreditCard className="h-4 w-4 mr-2" />
                            {isHighRisk ? "Pay Anyway" : "Skip & Pay Now"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
