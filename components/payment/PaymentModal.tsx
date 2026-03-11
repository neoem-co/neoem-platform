import { useState } from "react";
import { CreditCard, Shield, Loader2, QrCode, Landmark, Smartphone, CheckCircle2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    amount: number;
    factoryName: string;
    totalDealValue?: number;
}

const paymentMethods = [
    { id: "card", label: "Credit Card", icon: CreditCard },
    { id: "qr", label: "QR Code", icon: QrCode },
    { id: "bank", label: "Bank Transfer", icon: Landmark },
    { id: "promptpay", label: "PromptPay", icon: Smartphone },
];

export function PaymentModal({ open, onClose, onSuccess, amount, factoryName, totalDealValue = 120000 }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [selectedMethod, setSelectedMethod] = useState("card");
    const [paymentOption, setPaymentOption] = useState<"milestone" | "full">("milestone");

    const activeAmount = paymentOption === "full" ? totalDealValue : amount;
    const platformFee = activeAmount * 0.05;
    const factoryAmount = activeAmount * 0.95;

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
                        Pay to {factoryName} via Escrow
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Payment Option Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Payment Option</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPaymentOption("milestone")}
                                className={`p-3 rounded-lg border text-left transition-colors ${paymentOption === "milestone"
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <p className="text-sm font-medium text-foreground">Pay by Milestone</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    ฿{amount.toLocaleString()} (current)
                                </p>
                            </button>
                            <button
                                onClick={() => setPaymentOption("full")}
                                className={`p-3 rounded-lg border text-left transition-colors ${paymentOption === "full"
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <p className="text-sm font-medium text-foreground">Pay Full Amount</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    ฿{totalDealValue.toLocaleString()} (lump sum)
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Full payment escrow info */}
                    {paymentOption === "full" && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-primary" />
                                Escrow Holding & Auto-Release
                            </p>
                            <p className="text-xs text-muted-foreground">
                                The full ฿{totalDealValue.toLocaleString()} will be held in escrow. Funds are released to the factory automatically at each milestone — but only after you click <strong>"Approve"</strong>.
                            </p>
                            <div className="space-y-1 pt-1">
                                {[
                                    { label: "Deposit (30%)", amount: totalDealValue * 0.3 },
                                    { label: "Production (40%)", amount: totalDealValue * 0.4 },
                                    { label: "Final / QC (30%)", amount: totalDealValue * 0.3 },
                                ].map((m) => (
                                    <div key={m.label} className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{m.label}</span>
                                        <span className="text-foreground font-medium">฿{m.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Amount Summary */}
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {paymentOption === "full" ? "Total Amount (Full)" : "Milestone Amount"}
                            </span>
                            <span className="font-semibold text-foreground">฿{activeAmount.toLocaleString()}</span>
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

                    {/* Card Form */}
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

                    {selectedMethod === "qr" && (
                        <div className="p-6 border rounded-lg text-center space-y-3">
                            <div className="w-40 h-40 mx-auto bg-secondary rounded-lg flex items-center justify-center">
                                <QrCode className="h-20 w-20 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-foreground font-medium">Scan to pay ฿{activeAmount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">QR code expires in 15 minutes</p>
                        </div>
                    )}

                    {selectedMethod === "bank" && (
                        <div className="p-4 border rounded-lg space-y-3">
                            <p className="text-sm font-medium text-foreground">Transfer to:</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">Bank: <span className="text-foreground">Kasikorn Bank</span></p>
                                <p className="text-muted-foreground">Account: <span className="text-foreground">xxx-x-xxxxx-x</span></p>
                                <p className="text-muted-foreground">Name: <span className="text-foreground">NEOEM Escrow Co., Ltd.</span></p>
                                <p className="text-muted-foreground">Amount: <span className="text-foreground font-semibold">฿{activeAmount.toLocaleString()}</span></p>
                            </div>
                        </div>
                    )}

                    {selectedMethod === "promptpay" && (
                        <div className="p-6 border rounded-lg text-center space-y-3">
                            <Smartphone className="h-12 w-12 text-primary mx-auto" />
                            <p className="text-sm font-medium text-foreground">PromptPay ID: 0-xxxx-xxxxx-xx-x</p>
                            <p className="text-sm text-muted-foreground">Amount: ฿{activeAmount.toLocaleString()}</p>
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
                                `Pay ฿${activeAmount.toLocaleString()}`
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
