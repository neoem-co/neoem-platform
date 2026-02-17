"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Send, Paperclip, FileText, Download, Bot,
    Sparkles, FileCheck, AlertTriangle, ChevronRight, X,
    CreditCard, ArrowLeft, PanelRightClose, PanelRight
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { ContractWarningModal } from "@/components/payment/ContractWarningModal";
import { ContractDraftingForm } from "@/components/ai/ContractDraftingForm";
import { ContractReviewPanel } from "@/components/ai/ContractReviewPanel";
import { TOSModal } from "@/components/chat/TOSModal";
import { DepositActionCard } from "@/components/chat/DepositActionCard";
import factoriesData from "@/data/factories.json";

const factoryImages: Record<string, string> = {
    "factory-1": "/assets/factory-1.jpg",
    "factory-2": "/assets/factory-2.jpg",
    "factory-3": "/assets/factory-3.jpg",
    "factory-4": "/assets/factory-4.jpg",
    "factory-5": "/assets/factory-5.jpg",
};

interface Message {
    id: string;
    sender: "user" | "factory" | "system";
    message: string;
    timestamp: string;
    attachment?: {
        type: string;
        name: string;
        size: string;
    };
    isDepositCard?: boolean;
}

export default function DealRoom({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const factory = factoriesData.factories.find((f) => f.slug === slug);
    const [showTOS, setShowTOS] = useState(true);
    const [tosAccepted, setTosAccepted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    // Initialize messages inside useEffect to avoid SSR mismatch
    useEffect(() => {
        setMessages([
            ...factoriesData.chatHistory as Message[],
            {
                id: "deposit-card",
                sender: "system",
                message: "",
                timestamp: new Date().toISOString(),
                isDepositCard: true,
            }
        ]);
    }, []);

    const [inputValue, setInputValue] = useState("");
    const [showContractPreview, setShowContractPreview] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showContractWarning, setShowContractWarning] = useState(false);
    const [aiMode, setAiMode] = useState<"summary" | "drafting" | "review">("summary");
    const [contractData, setContractData] = useState<any>(null);
    const [mobileAiOpen, setMobileAiOpen] = useState(false);
    const [aiPanelOpen, setAiPanelOpen] = useState(true);
    const [depositPaid, setDepositPaid] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const hasContractInChat = messages.some((m) => m.attachment?.type === "application/pdf");
    const depositAmount = 36000;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleTOSAccept = () => {
        setTosAccepted(true);
        setShowTOS(false);
    };

    if (!factory) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-20 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Factory not found</h1>
                    <Link href="/factories" className="text-primary hover:underline mt-4 inline-block">
                        Browse all factories
                    </Link>
                </div>
            </div>
        );
    }

    const imageUrl = factoryImages[factory.image] || "/assets/factory-1.jpg";

    const handleSend = () => {
        if (!inputValue.trim() || !tosAccepted) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            message: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages([...messages, newMessage]);
        setInputValue("");

        setTimeout(() => {
            const response: Message = {
                id: (Date.now() + 1).toString(),
                sender: "factory",
                message: "Thank you for your message! Our team will review and respond shortly.",
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, response]);
        }, 1500);
    };

    const handleDraftContract = () => {
        setAiMode("drafting");
    };

    const handleCheckRisks = () => {
        setAiMode("review");
    };

    const handleContractGenerated = (data: any) => {
        setContractData(data);
        setAiMode("summary");
        setShowContractPreview(true);
    };

    const handlePayDeposit = () => {
        if (hasContractInChat || contractData) {
            setShowContractWarning(true);
        } else {
            setShowPaymentModal(true);
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setDepositPaid(true);
        router.push("/legal-nudge");
    };

    const AIAssistantContent = () => (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
            {aiMode === "summary" && (
                <>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Live Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-3 text-sm text-muted-foreground">
                            <p><strong className="text-foreground">Product:</strong> Sunscreen SPF50 (Mousse)</p>
                            <p><strong className="text-foreground">Quantity:</strong> 1,000 pieces</p>
                            <p><strong className="text-foreground">Total:</strong> ฿120,000</p>
                            <p><strong className="text-foreground">Delivery:</strong> 4-6 weeks</p>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        <Button className="w-full justify-start" onClick={handleDraftContract}>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Draft Contract
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={handleCheckRisks}>
                            <AlertTriangle className="h-4 w-4 mr-2 text-warning" />
                            Check Risks
                        </Button>
                        <Button variant="secondary" className="w-full justify-start" onClick={handlePayDeposit}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Deposit (30%)
                        </Button>
                    </div>

                    {showContractPreview && (
                        <Card className="border-primary/30 animate-fade-in">
                            <CardHeader className="py-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Contract Preview
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowContractPreview(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="py-3 space-y-3">
                                <div className="p-3 bg-secondary/50 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Buyer</span>
                                        <span className="text-foreground font-medium">Your Company</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Seller</span>
                                        <span className="text-foreground font-medium">{factory.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Product</span>
                                        <span className="text-foreground font-medium">{contractData?.productType || "Sunscreen SPF50"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Quantity</span>
                                        <span className="text-foreground font-medium">{contractData?.quantity || "1,000"} pcs</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Price</span>
                                        <span className="text-foreground font-medium">฿{parseInt(contractData?.totalPrice || "120000").toLocaleString()}</span>
                                    </div>
                                    {contractData?.penaltyClause && contractData.penaltyClause !== "none" && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Penalty</span>
                                            <span className="text-foreground font-medium">{contractData.penaltyClause}%/day</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-2 bg-warning/10 rounded-lg flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-warning">
                                        Missing: Company registration details. Consider registering for FDA compliance.
                                    </p>
                                </div>

                                <Button className="w-full" onClick={handlePayDeposit}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Confirm & Pay Deposit
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-secondary/30">
                        <CardContent className="py-4">
                            <p className="text-xs text-muted-foreground">
                                💡 <strong>Tip:</strong> Ask for sample testing before bulk order to ensure quality meets your standards.
                            </p>
                        </CardContent>
                    </Card>
                </>
            )}

            {aiMode === "drafting" && (
                <ContractDraftingForm
                    factoryName={factory.name}
                    onGenerate={handleContractGenerated}
                    onClose={() => setAiMode("summary")}
                />
            )}

            {aiMode === "review" && (
                <ContractReviewPanel onClose={() => setAiMode("summary")} />
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            {/* TOS Modal */}
            <TOSModal open={showTOS} onAccept={handleTOSAccept} />

            {/* Mobile Header with Back Button */}
            <div className="lg:hidden border-b bg-card">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                        <Link href={`/factory/${slug}`}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                                <img src={imageUrl} alt={factory.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-foreground text-sm">{factory.name}</h2>
                                <p className="text-[10px] text-success">● Online</p>
                            </div>
                        </div>
                    </div>

                    <Sheet open={mobileAiOpen} onOpenChange={setMobileAiOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Bot className="h-4 w-4 mr-1" />
                                AI
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh]">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-primary" />
                                    AI Legal Assistant
                                </SheetTitle>
                            </SheetHeader>
                            <AIAssistantContent />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Breadcrumb */}
            <div className="hidden lg:block border-b">
                <div className="container py-3">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/factories" className="hover:text-foreground">Factories</Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href={`/factory/${slug}`} className="hover:text-foreground">{factory.name}</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground">Deal Room</span>
                    </nav>
                </div>
            </div>

            {/* Main Content - Split Screen */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Chat */}
                <div className={`flex-1 flex flex-col ${aiPanelOpen ? "lg:w-[65%]" : "lg:w-full"}`}>
                    {/* Desktop Chat Header */}
                    <div className="hidden lg:flex p-4 border-b items-center justify-between bg-card">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img src={imageUrl} alt={factory.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-foreground">{factory.name}</h2>
                                <p className="text-xs text-success">● Online</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiPanelOpen(!aiPanelOpen)}
                            className="flex items-center gap-2"
                        >
                            {aiPanelOpen ? (
                                <>
                                    <PanelRightClose className="h-4 w-4" />
                                    Hide AI
                                </>
                            ) : (
                                <>
                                    <PanelRight className="h-4 w-4" />
                                    <Bot className="h-4 w-4" />
                                    Legal Assistant
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20 scrollbar-thin">
                        {messages.map((msg) => {
                            if (msg.isDepositCard) {
                                return (
                                    <DepositActionCard
                                        key={msg.id}
                                        amount={depositAmount}
                                        status={depositPaid ? "paid" : "pending"}
                                        onPay={handlePayDeposit}
                                    />
                                );
                            }

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] lg:max-w-[75%] rounded-xl p-3 ${msg.sender === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card border"
                                            }`}
                                    >
                                        <p className={msg.sender === "user" ? "text-primary-foreground" : "text-foreground"}>
                                            {msg.message}
                                        </p>

                                        {msg.attachment && (
                                            <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${msg.sender === "user" ? "bg-primary-foreground/10" : "bg-secondary"
                                                }`}>
                                                <FileText className="h-5 w-5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{msg.attachment.name}</p>
                                                    <p className="text-xs opacity-70">{msg.attachment.size}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}

                                        <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                                            }`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 lg:p-4 border-t bg-card">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button variant="ghost" size="icon" className="hidden sm:flex">
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder={tosAccepted ? "Type your message..." : "Accept Terms of Service to start chatting..."}
                                disabled={!tosAccepted}
                                className="flex-1 h-10 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                            />
                            <Button onClick={handleSend} disabled={!inputValue.trim() || !tosAccepted} size="icon" className="lg:px-4 lg:w-auto">
                                <Send className="h-4 w-4" />
                                <span className="hidden lg:inline ml-2">Send</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Panel - AI Assistant (Desktop Only - Collapsible) */}
                {aiPanelOpen && (
                    <aside className="hidden lg:flex lg:w-[35%] flex-col bg-card border-l">
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground">AI Legal Assistant</h3>
                            </div>
                        </div>

                        <AIAssistantContent />
                    </aside>
                )}
            </div>

            {/* Modals */}
            <PaymentModal
                open={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                amount={depositAmount}
                factoryName={factory.name}
            />

            <ContractWarningModal
                open={showContractWarning}
                onClose={() => setShowContractWarning(false)}
                onSkip={() => {
                    setShowContractWarning(false);
                    setShowPaymentModal(true);
                }}
                onReview={() => {
                    setShowContractWarning(false);
                    setAiMode("review");
                    setMobileAiOpen(true);
                }}
            />
        </div>
    );
}
