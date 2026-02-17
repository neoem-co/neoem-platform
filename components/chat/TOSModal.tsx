import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
    const [agreed, setAgreed] = useState(false);

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Terms of Service & NDA Agreement
                    </DialogTitle>
                    <DialogDescription>
                        Please accept our terms before starting the conversation
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground max-h-48 overflow-y-auto">
                        <h4 className="font-semibold text-foreground mb-2">Trade Secrets Protection</h4>
                        <p className="mb-3">
                            By using NEOEM's messaging platform, you agree to protect all trade secrets,
                            formulations, pricing information, and business strategies shared during negotiations.
                        </p>
                        <h4 className="font-semibold text-foreground mb-2">Confidentiality</h4>
                        <p className="mb-3">
                            All information exchanged through this platform is confidential and shall not be
                            disclosed to third parties without written consent.
                        </p>
                        <h4 className="font-semibold text-foreground mb-2">Platform Rules</h4>
                        <p>
                            Users must conduct business in good faith and not use information gained
                            through negotiations to circumvent the platform.
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
                            I agree to NEOEM's Terms of Service & NDA Policy regarding trade secrets protection
                        </label>
                    </div>

                    <Button
                        className="w-full"
                        disabled={!agreed}
                        onClick={onAccept}
                    >
                        Accept & Start Chatting
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
