import { useState } from "react";
import { CreditCard, Shield, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    amount: number;
    factoryName: string;
}

export function PaymentModal({ open, onClose, onSuccess, amount, factoryName }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");

    const platformFee = amount * 0.05;
    const factoryAmount = amount * 0.95;

    const handlePayment = async () => {
        setLoading(true);
        // Mock Omise payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setLoading(false);
        onSuccess();
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || "";
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(" ") : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4);
        }
        return v;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Secure Payment
                    </DialogTitle>
                    <DialogDescription>
                        Pay deposit to {factoryName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Amount Summary */}
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Amount</span>
                            <span className="font-semibold text-foreground">฿{amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Factory receives (95%)</span>
                            <span>฿{factoryAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Platform fee (5%)</span>
                            <span>฿{platformFee.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Trust Signal */}
                    <div className="flex items-start gap-2 p-3 bg-success/10 rounded-lg">
                        <Shield className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-success">
                            Your payment is held securely by Opn Payments. Funds are released to the factory only upon your approval.
                        </p>
                    </div>

                    {/* Card Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="card-number">Card Number</Label>
                            <Input
                                id="card-number"
                                placeholder="4242 4242 4242 4242"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={19}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Input
                                    id="expiry"
                                    placeholder="MM/YY"
                                    value={expiry}
                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                    maxLength={5}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <Input
                                    id="cvc"
                                    placeholder="123"
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                    maxLength={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={loading || !cardNumber || !expiry || !cvc}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                `Pay ฿${amount.toLocaleString()}`
                            )}
                        </Button>
                    </div>

                    {/* Payment Provider Logo */}
                    <p className="text-center text-xs text-muted-foreground">
                        Powered by Opn Payments (Omise)
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
