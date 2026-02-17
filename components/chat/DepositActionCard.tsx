import { CreditCard, Clock, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DepositActionCardProps {
    amount: number;
    status: "pending" | "paid";
    onPay: () => void;
}

export function DepositActionCard({ amount, status, onPay }: DepositActionCardProps) {
    const isPaid = status === "paid";

    return (
        <Card className={`my-4 border-2 ${isPaid ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaid ? "bg-success/20" : "bg-primary/20"
                            }`}>
                            {isPaid ? (
                                <CheckCircle2 className="h-6 w-6 text-success" />
                            ) : (
                                <CreditCard className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-foreground">
                                    Deposit Payment (30%)
                                </span>
                                <Badge variant={isPaid ? "default" : "outline"} className={
                                    isPaid
                                        ? "bg-success text-success-foreground"
                                        : "text-warning border-warning"
                                }>
                                    {isPaid ? "Paid" : "Pending"}
                                </Badge>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                ฿{amount.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {!isPaid && (
                        <Button size="lg" onClick={onPay} className="w-full sm:w-auto">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Deposit via Omise
                        </Button>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                            Your payment is held securely by Opn Payments. Funds are released to the factory
                            only upon your approval after delivery.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
