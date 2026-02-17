import { useState } from "react";
import { FileSearch, AlertTriangle, CheckCircle2, XCircle, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContractReviewPanelProps {
    onClose: () => void;
}

interface RiskItem {
    id: string;
    type: "high" | "medium" | "low";
    clause: string;
    description: string;
}

const mockRisks: RiskItem[] = [
    {
        id: "1",
        type: "high",
        clause: "Termination Clause (Missing)",
        description: "No termination clause found. Recommend adding exit terms.",
    },
    {
        id: "2",
        type: "medium",
        clause: "Payment Terms - Clause 4.2",
        description: "100% upfront payment is risky. Consider milestone-based payments.",
    },
    {
        id: "3",
        type: "low",
        clause: "Delivery Timeline - Clause 6.1",
        description: "Delivery deadline is vague. Specify exact dates.",
    },
];

export function ContractReviewPanel({ onClose }: ContractReviewPanelProps) {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<RiskItem[] | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        // Mock OCR + Legal AI analysis
        await new Promise((resolve) => setTimeout(resolve, 2500));
        setAnalyzing(false);
        setResults(mockRisks);
    };

    const getRiskIcon = (type: RiskItem["type"]) => {
        switch (type) {
            case "high":
                return <XCircle className="h-4 w-4 text-destructive" />;
            case "medium":
                return <AlertTriangle className="h-4 w-4 text-warning" />;
            case "low":
                return <CheckCircle2 className="h-4 w-4 text-success" />;
        }
    };

    const getRiskColor = (type: RiskItem["type"]) => {
        switch (type) {
            case "high":
                return "bg-destructive/10 border-destructive/30";
            case "medium":
                return "bg-warning/10 border-warning/30";
            case "low":
                return "bg-success/10 border-success/30";
        }
    };

    return (
        <Card className="border-primary/30">
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <FileSearch className="h-4 w-4 text-primary" />
                        Contract Review (AI)
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!results ? (
                    <>
                        {/* File Upload */}
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            {file ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-foreground font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">Ready for analysis</p>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Upload contract PDF or select from chat
                                    </p>
                                </label>
                            )}
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={!file || analyzing}
                            className="w-full"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing with OCR + Legal AI...
                                </>
                            ) : (
                                <>
                                    <FileSearch className="h-4 w-4 mr-2" />
                                    Analyze Contract
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                            Powered by iApp OCR & Thanoy Legal AI
                        </p>
                    </>
                ) : (
                    <>
                        {/* Risk Summary */}
                        <div className="p-3 bg-warning/10 rounded-lg">
                            <p className="text-sm font-medium text-foreground">
                                Risk Level: <span className="text-warning">Medium</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Found {results.length} items requiring attention
                            </p>
                        </div>

                        {/* Risk List */}
                        <div className="space-y-2">
                            {results.map((risk) => (
                                <div
                                    key={risk.id}
                                    className={`p-3 rounded-lg border ${getRiskColor(risk.type)}`}
                                >
                                    <div className="flex items-start gap-2">
                                        {getRiskIcon(risk.type)}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">
                                                {risk.clause}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {risk.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" onClick={() => setResults(null)} className="w-full">
                            Analyze Another Document
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
