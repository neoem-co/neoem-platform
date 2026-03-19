import { AlertTriangle, FileWarning, FileSearch, CreditCard } from "lucide-react";
import { useLocale } from "next-intl";
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
    const locale = useLocale();
    const isThai = locale.startsWith("th");
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
                        {isHighRisk
                            ? (isThai ? "ตรวจพบสัญญาที่มีความเสี่ยงสูง" : "High-Risk Contract Detected")
                            : (isThai ? "ตรวจสัญญาก่อนชำระเงินดีไหม?" : "Review Contract before Payment?")}
                    </DialogTitle>
                    <DialogDescription>
                        {isHighRisk
                            ? (isThai
                                ? "AI พบประเด็นความเสี่ยงสูงในสัญญา กรุณาแก้ไขก่อนปล่อยชำระเงิน"
                                : "Our AI review found high-risk issues. Please resolve them before releasing payment.")
                            : (isThai
                                ? "ดีลนี้มีสัญญากฎหมาย เราแนะนำให้ใช้ AI Reviewer เพื่อตรวจหาความเสี่ยงก่อน"
                                : "This deal includes a legal contract. We recommend using our AI Reviewer to check for risks.")}
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
                                {isHighRisk
                                    ? (isThai ? "มีข้อสัญญาสำคัญที่ควรแก้ไขก่อนปล่อยเงิน" : "Critical clauses need attention before money is released")
                                    : (isThai ? "AI ช่วยตรวจหาข้อสัญญาเสี่ยงและการคุ้มครองที่ขาดหายไป" : "AI can identify risky clauses and missing protections")}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={isHighRisk ? "text-destructive" : "text-warning"}>•</span>
                                {isHighRisk
                                    ? (isThai ? "ดูคำแนะนำจาก AI และปรับเงื่อนไขที่ไม่เป็นธรรม" : "Review the AI recommendations and update unfair terms")
                                    : (isThai ? "รับคำแนะนำเพื่อปรับปรุงเงื่อนไขสัญญาให้ดีขึ้น" : "Get recommendations for better terms")}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className={isHighRisk ? "text-destructive" : "text-warning"}>•</span>
                                {isHighRisk
                                    ? (isThai ? "คุณยังดำเนินการต่อได้ แต่ดีลนี้จะยังมีความเสี่ยงทางกฎหมายค้างอยู่" : "You can still proceed, but the deal will carry unresolved legal risk")
                                    : (isThai ? "ใช้เวลาไม่ถึง 30 วินาที" : "Takes less than 30 seconds")}
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={onReview} className="w-full">
                            <FileSearch className="h-4 w-4 mr-2" />
                            {isHighRisk
                                ? (isThai ? "ตรวจประเด็นความเสี่ยงสูง" : "Review High-Risk Issues")
                                : (isThai ? "ตรวจสัญญาด้วย AI" : "Review Contract with AI")}
                        </Button>
                        <Button variant="outline" onClick={onSkip} className="w-full">
                            <CreditCard className="h-4 w-4 mr-2" />
                            {isHighRisk
                                ? (isThai ? "ชำระต่อแม้มีความเสี่ยง" : "Pay Anyway")
                                : (isThai ? "ข้ามและชำระเลย" : "Skip & Pay Now")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
