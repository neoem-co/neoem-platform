import { useState } from "react";
import { CreditCard, Shield, Loader2, QrCode, Landmark, Smartphone } from "lucide-react";
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

const paymentMethods = [
    { id: "card", label: "Credit Card", icon: CreditCard },
    { id: "qr", label: "QR Code", icon: QrCode },
    { id: "bank", label: "Bank Transfer", icon: Landmark },
    { id: "promptpay", label: "PromptPay", icon: Smartphone },
];

export function PaymentModal({ open, onClose, onSuccess, amount, factoryName }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [selectedMethod, setSelectedMethod] = useState("card");

    const platformFee = amount * 0.05;
    const factoryAmount = amount * 0.95;

    const handlePayment = async () => {
        setLoading(true);
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
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

                    {/* Payment Method Selection */}
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${selectedMethod === method.id
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border text-muted-foreground hover:border-primary/50"
                                        }`}
                                >
                                    <method.icon className="h-4 w-4" />
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trust Signal */}
                    <div className="flex items-start gap-2 p-3 bg-success/10 rounded-lg">
                        <Shield className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-success">
                            Your payment is held securely by Opn Payments. Funds are released to the factory only upon your approval.
                        </p>
                    </div>

                    {/* Card Form (shown for credit card) */}
                    {selectedMethod === "card" && (
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
                    )}

                    {/* QR Code */}
                    {selectedMethod === "qr" && (
                        <div className="p-6 border rounded-lg text-center space-y-3">
                            <div className="w-40 h-40 mx-auto bg-secondary rounded-lg flex items-center justify-center">
                                <QrCode className="h-20 w-20 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-foreground font-medium">Scan to pay ฿{amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">QR code expires in 15 minutes</p>
                        </div>
                    )}

                    {/* Bank Transfer */}
                    {selectedMethod === "bank" && (
                        <div className="p-4 border rounded-lg space-y-3">
                            <p className="text-sm font-medium text-foreground">Transfer to:</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">Bank: <span className="text-foreground">Kasikorn Bank</span></p>
                                <p className="text-muted-foreground">Account: <span className="text-foreground">xxx-x-xxxxx-x</span></p>
                                <p className="text-muted-foreground">Name: <span className="text-foreground">NEOEM Escrow Co., Ltd.</span></p>
                                <p className="text-muted-foreground">Amount: <span className="text-foreground font-semibold">฿{amount.toLocaleString()}</span></p>
                            </div>
                        </div>
                    )}

                    {/* PromptPay */}
                    {selectedMethod === "promptpay" && (
                        <div className="p-6 border rounded-lg text-center space-y-3">
                            <Smartphone className="h-12 w-12 text-primary mx-auto" />
                            <p className="text-sm font-medium text-foreground">PromptPay ID: 0-xxxx-xxxxx-xx-x</p>
                            <p className="text-sm text-muted-foreground">Amount: ฿{amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Open your banking app to complete the payment</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={loading || (selectedMethod === "card" && (!cardNumber || !expiry || !cvc))}
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

                    <p className="text-center text-xs text-muted-foreground">
                        Powered by Opn Payments (Omise)
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
