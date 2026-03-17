import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Shield } from "lucide-react";

interface TOSModalProps {
    open: boolean;
    onAccept: () => void;
}

export function TOSModal({ open, onAccept }: TOSModalProps) {
    const t = useTranslations();
    const [agreed, setAgreed] = useState(false);

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {t("chat.tosModal.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("chat.tosModal.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground max-h-48 overflow-y-auto">
                        <h4 className="font-semibold text-foreground mb-2">{t("chat.tosModal.tradeSecrets")}</h4>
                        <p className="mb-3">
                            {t("chat.tosModal.tradeSecretsDesc")}
                        </p>
                        <h4 className="font-semibold text-foreground mb-2">{t("chat.tosModal.confidentiality")}</h4>
                        <p className="mb-3">
                            {t("chat.tosModal.confidentialityDesc")}
                        </p>
                        <h4 className="font-semibold text-foreground mb-2">{t("chat.tosModal.platformRules")}</h4>
                        <p>
                            {t("chat.tosModal.platformRulesDesc")}
                        </p>
                    </div>

                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="tos"
                            checked={agreed}
                            onCheckedChange={(checked) => setAgreed(checked === true)}
                        />
                        <label
                            htmlFor="tos"
                            className="text-sm text-foreground leading-relaxed cursor-pointer"
                        >
                            {t("chat.tosModal.agree")}
                        </label>
                    </div>

                    <Button
                        className="w-full"
                        disabled={!agreed}
                        onClick={onAccept}
                    >
                        {t("chat.tosModal.accept")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
