import { FileWarning, FileSearch, CreditCard } from "lucide-react";
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
}

export function ContractWarningModal({ open, onClose, onSkip, onReview }: ContractWarningModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileWarning className="h-5 w-5 text-warning" />
                        Review Contract before Payment?
                    </DialogTitle>
                    <DialogDescription>
                        This deal includes a legal contract. We recommend using our AI Reviewer to check for risks.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="p-4 bg-warning/10 rounded-lg">
                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-warning">•</span>
                                AI can identify risky clauses and missing protections
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-warning">•</span>
                                Get recommendations for better terms
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-warning">•</span>
                                Takes less than 30 seconds
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={onReview} className="w-full">
                            <FileSearch className="h-4 w-4 mr-2" />
                            Review Contract with AI
                        </Button>
                        <Button variant="outline" onClick={onSkip} className="w-full">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Skip & Pay Now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
