import { useState } from "react";
import { PenTool, CheckCircle2, Loader2, FileText, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ESignaturePanelProps {
    factoryName?: string;
}

export function ESignaturePanel({ factoryName = "Factory" }: ESignaturePanelProps) {
    const [step, setStep] = useState<"upload" | "sign" | "done">("upload");
    const [signing, setSigning] = useState(false);
    const [fullName, setFullName] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSign = async () => {
        setSigning(true);
        await new Promise((r) => setTimeout(r, 2000));
        setSigning(false);
        setStep("done");
    };

    if (step === "done") {
        return (
            <div className="max-w-lg mx-auto p-6 space-y-6 text-center">
                <div className="p-8 bg-success/5 border border-success/20 rounded-xl space-y-3">
                    <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
                    <p className="font-semibold text-foreground text-lg">Contract Signed!</p>
                    <p className="text-sm text-muted-foreground">Both parties have been notified.</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-foreground">Signed_Contract.pdf</span>
                    </div>
                    <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Download</Button>
                </div>
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Signatories</p>
                    <div className="flex justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-success" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-medium text-foreground">{fullName || "You"}</p>
                                <p className="text-[10px] text-success">✓ Signed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-medium text-foreground">{factoryName}</p>
                                <p className="text-[10px] text-warning">⏳ Pending</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto p-6 space-y-6">
            <div className="text-center space-y-2">
                <PenTool className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-lg font-semibold text-foreground">E-Signature</h2>
                <p className="text-sm text-muted-foreground">Sign your contract digitally</p>
            </div>

            {step === "upload" && (
                <div className="space-y-4">
                    <label className="cursor-pointer block">
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setFile(e.target.files[0]);
                                    setStep("sign");
                                }
                            }}
                        />
                        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors border-border hover:border-primary/50`}>
                            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                            <p className="text-foreground font-medium">Upload contract PDF</p>
                            <p className="text-sm text-muted-foreground">Or use your latest draft from AI Legal Workspace</p>
                        </div>
                    </label>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            setFile(new File([], "Contract_Draft.pdf"));
                            setStep("sign");
                        }}
                    >
                        <FileText className="h-4 w-4 mr-2" /> Use Latest AI Draft
                    </Button>
                </div>
            )}

            {step === "sign" && (
                <div className="space-y-4">
                    <Card className="bg-secondary/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium text-foreground">{file?.name || "Contract_Draft.pdf"}</p>
                                <p className="text-xs text-muted-foreground">Ready to sign</p>
                            </div>
                            <Badge variant="outline" className="ml-auto text-xs">Verified</Badge>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        <Label>Full Legal Name</Label>
                        <Input
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Signature Preview</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center bg-card">
                            {fullName ? (
                                <p className="text-2xl italic text-foreground font-serif">{fullName}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Type your name above to preview</p>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={handleSign}
                        disabled={!fullName || signing}
                        className="w-full"
                        size="lg"
                    >
                        {signing ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing...</>
                        ) : (
                            <><PenTool className="h-4 w-4 mr-2" /> Sign Contract</>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        By signing, you agree to the terms stated in the contract.
                    </p>
                </div>
            )}
        </div>
    );
}
