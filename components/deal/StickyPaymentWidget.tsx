import { CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyPaymentWidgetProps {
    currentMilestone: string;
    amount: number;
    status: "pending" | "paid";
    onPay: () => void;
}

export function StickyPaymentWidget({ currentMilestone, amount, status, onPay }: StickyPaymentWidgetProps) {
    const isPaid = status === "paid";

    return (
        <div className="sticky bottom-0 z-20 border-t bg-card px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPaid ? "bg-success/20" : "bg-primary/20"
                        }`}>
                        {isPaid ? <Shield className="h-4 w-4 text-success" /> : <CreditCard className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{currentMilestone}</p>
                        <p className="text-sm font-bold text-foreground">฿{amount.toLocaleString()}</p>
                    </div>
                </div>
                {!isPaid ? (
                    <Button size="sm" className="h-8 text-xs flex-shrink-0" onClick={onPay}>
                        <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay Escrow
                    </Button>
                ) : (
                    <span className="text-xs text-success font-medium flex-shrink-0">✓ Paid</span>
                )}
            </div>
        </div>
    );
}