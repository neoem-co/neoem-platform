import { useState } from "react";
import { FileSearch, AlertTriangle, CheckCircle2, XCircle, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    analyzeContractRisk,
    type RiskCheckResponse,
    type RiskItemResult,
    type ChatMessagePayload,
    type FactoryInfoPayload,
} from "@/lib/ai-api";

interface ContractReviewPanelProps {
    onClose: () => void;
    chatHistory?: ChatMessagePayload[];
    factoryInfo?: FactoryInfoPayload;
}

type RiskType = "high" | "medium" | "low";

interface RiskItem {
    id: string;
    type: RiskType;
    clause: string;
    description: string;
}

function mapRiskLevel(level: string): RiskType {
    if (level === "critical" || level === "high") return "high";
    if (level === "medium") return "medium";
    return "low";
}

function mapApiRisks(risks: RiskItemResult[]): RiskItem[] {
    return risks.map((r) => ({
        id: r.risk_id,
        type: mapRiskLevel(r.level),
        clause: r.title_en || r.title_th,
        description: r.description_en || r.description_th,
    }));
}

export function ContractReviewPanel({ onClose, chatHistory = [], factoryInfo }: ContractReviewPanelProps) {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<RiskItem[] | null>(null);
    const [overallRisk, setOverallRisk] = useState<string>("medium");
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setError(null);
        try {
            const response: RiskCheckResponse = await analyzeContractRisk(
                file,
                chatHistory,
                factoryInfo,
            );
            setResults(mapApiRisks(response.risks));
            setOverallRisk(response.overall_risk);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Analysis failed";
            setError(message);
        } finally {
            setAnalyzing(false);
        }
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

                        {error && (
                            <p className="text-xs text-destructive text-center">{error}</p>
                        )}

                        <p className="text-xs text-muted-foreground text-center">
                            Powered by iApp OCR & Thanoy Legal AI
                        </p>
                    </>
                ) : (
                    <>
                        {/* Risk Summary */}
                        <div className={`p-3 rounded-lg ${overallRisk === "critical" || overallRisk === "high" ? "bg-destructive/10" : overallRisk === "medium" ? "bg-warning/10" : "bg-success/10"}`}>
                            <p className="text-sm font-medium text-foreground">
                                Risk Level: <span className={overallRisk === "critical" || overallRisk === "high" ? "text-destructive" : overallRisk === "medium" ? "text-warning" : "text-success"}>{overallRisk.charAt(0).toUpperCase() + overallRisk.slice(1)}</span>
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
