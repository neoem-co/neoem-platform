"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    Send, Paperclip, FileText, Download, Bot,
    Sparkles, FileCheck, AlertTriangle, ChevronRight, X,
    CreditCard, ArrowLeft, PanelRightClose, PanelRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { ContractWarningModal } from "@/components/payment/ContractWarningModal";
import { AILegalWorkspace } from "@/components/legal/AILegalWorkspace";
import { TOSModal } from "@/components/chat/TOSModal";
import { MilestoneTracker } from "@/components/deal/MilestoneTracker";
import { StickyPaymentWidget } from "@/components/deal/StickyPaymentWidget";
import factoriesData from "@/data/factories.json";
import factory1 from "@/public/assets/factory-1.jpg";
import factory2 from "@/public/assets/factory-2.jpg";
import factory3 from "@/public/assets/factory-3.jpg";
import factory4 from "@/public/assets/factory-4.jpg";
import factory5 from "@/public/assets/factory-5.jpg";

const factoryImages: Record<string, any> = {
    "factory-1": factory1, "factory-2": factory2, "factory-3": factory3,
    "factory-4": factory4, "factory-5": factory5,
};

interface Message {
    id: string;
    sender: "user" | "factory" | "system";
    message: string;
    timestamp: string;
    attachment?: { type: string; name: string; size: string };
}

const DealRoom = () => {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const factory = factoriesData.factories.find((f) => f.slug === slug);
    const [showTOS, setShowTOS] = useState(true);
    const [tosAccepted, setTosAccepted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([...factoriesData.chatHistory as Message[]]);
    const [inputValue, setInputValue] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showContractWarning, setShowContractWarning] = useState(false);
    const [mobileAiOpen, setMobileAiOpen] = useState(false);
    const [aiPanelOpen, setAiPanelOpen] = useState(true);
    const [depositPaid, setDepositPaid] = useState(false);
    const [showLegalWorkspace, setShowLegalWorkspace] = useState(false);
    const [legalWorkspaceTab, setLegalWorkspaceTab] = useState<"draft" | "risk" | "history" | "esign">("draft");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasContractInChat = messages.some((m) => m.attachment?.type === "application/pdf");
    const depositAmount = 36000;
    const totalDealValue = 120000;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleTOSAccept = () => { setTosAccepted(true); setShowTOS(false); };

    if (!factory) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-20 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Factory not found</h1>
                    <Link href="/factories" className="text-primary hover:underline mt-4 inline-block">Browse all factories</Link>
                </div>
            </div>
        );
    }

    const imageUrl = factoryImages[factory.image] || factory1;

    const handleSend = () => {
        if (!inputValue.trim() || !tosAccepted) return;
        const newMessage: Message = { id: Date.now().toString(), sender: "user", message: inputValue, timestamp: new Date().toISOString() };
        setMessages([...messages, newMessage]);
        setInputValue("");
        setTimeout(() => {
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: "factory", message: "Thank you for your message! Our team will review and respond shortly.", timestamp: new Date().toISOString() }]);
        }, 1500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const fileMsg: Message = {
                id: Date.now().toString(), sender: "user",
                message: `Uploaded: ${e.target.files[0].name}`, timestamp: new Date().toISOString(),
                attachment: { type: e.target.files[0].type || "application/pdf", name: e.target.files[0].name, size: `${(e.target.files[0].size / 1024).toFixed(0)} KB` },
            };
            setMessages(prev => [...prev, fileMsg]);
        }
    };

    const openLegalWorkspace = (tab: "draft" | "risk" | "history" | "esign") => {
        setLegalWorkspaceTab(tab);
        setShowLegalWorkspace(true);
    };

    const handlePayDeposit = () => {
        if (hasContractInChat) setShowContractWarning(true);
        else setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => { setShowPaymentModal(false); setDepositPaid(true); };

    const handleMilestoneAction = (action: string) => {
        // Handle preview actions
        if (action.startsWith("preview-")) {
            const baseAction = action.replace("preview-", "");
            if (baseAction === "draft") openLegalWorkspace("history");
            else if (baseAction === "risk") openLegalWorkspace("risk");
            return;
        }
        switch (action) {
            case "draft": openLegalWorkspace("draft"); break;
            case "risk": openLegalWorkspace("risk"); break;
            case "esign": openLegalWorkspace("esign"); break;
            case "pay-1": case "pay-2": case "pay-3": handlePayDeposit(); break;
            case "launchpad": router.push("/brand-launchpad"); break;
        }
    };

    // Right panel content
    const SidePanelContent = () => (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
                <MilestoneTracker onAction={handleMilestoneAction} />

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" /> Live Summary
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
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick Actions</p>
                    <Button className="w-full justify-start text-xs h-8" onClick={() => openLegalWorkspace("draft")}>
                        <FileCheck className="h-3.5 w-3.5 mr-2" /> Draft Contract
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" onClick={() => openLegalWorkspace("risk")}>
                        <AlertTriangle className="h-3.5 w-3.5 mr-2 text-warning" /> Check Risks
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-xs h-8 text-muted-foreground" onClick={() => openLegalWorkspace("history")}>
                        <FileText className="h-3.5 w-3.5 mr-2" /> Legal Hub
                    </Button>
                </div>

                <Card className="bg-secondary/30">
                    <CardContent className="py-3">
                        <p className="text-xs text-muted-foreground">
                            💡 <strong>Tip:</strong> Both you and the factory see the same milestone status in real-time — full transparency.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <StickyPaymentWidget
                currentMilestone="1st Payment (Deposit 30%)"
                amount={depositAmount}
                status={depositPaid ? "paid" : "pending"}
                onPay={handlePayDeposit}
            />
        </div>
    );

    return (
        <div className="h-screen bg-background flex flex-col">
            <Navbar />
            <TOSModal open={showTOS} onAccept={handleTOSAccept} />

            {/* Mobile Header */}
            <div className="lg:hidden border-b bg-card">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                        <Link href={`/factory/${slug}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden"><img src={imageUrl.src || imageUrl} alt={factory.name} className="w-full h-full object-cover" /></div>
                            <div>
                                <h2 className="font-semibold text-foreground text-sm">{factory.name}</h2>
                                <p className="text-[10px] text-success">● Online</p>
                            </div>
                        </div>
                    </div>
                    <Sheet open={mobileAiOpen} onOpenChange={setMobileAiOpen}>
                        <SheetTrigger asChild><Button variant="outline" size="sm"><Bot className="h-4 w-4 mr-1" /> Timeline</Button></SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
                            <SheetHeader><SheetTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI Middleman Hub</SheetTitle></SheetHeader>
                            <SidePanelContent />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Breadcrumb */}
            <div className="hidden lg:block border-b">
                <div className="container py-3">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">Home</Link><ChevronRight className="h-4 w-4" />
                        <Link href="/factories" className="hover:text-foreground">Factories</Link><ChevronRight className="h-4 w-4" />
                        <Link href={`/factory/${slug}`} className="hover:text-foreground">{factory.name}</Link><ChevronRight className="h-4 w-4" />
                        <span className="text-foreground">Deal Room</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                <div className={`flex-1 flex flex-col ${aiPanelOpen ? "lg:w-[65%]" : "lg:w-full"}`}>
                    {/* Desktop Chat Header */}
                    <div className="hidden lg:flex p-4 border-b items-center justify-between bg-card">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden"><img src={imageUrl.src || imageUrl} alt={factory.name} className="w-full h-full object-cover" /></div>
                            <div>
                                <h2 className="font-semibold text-foreground">{factory.name}</h2>
                                <p className="text-xs text-success">● Online</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setAiPanelOpen(!aiPanelOpen)} className="flex items-center gap-2">
                            {aiPanelOpen ? <><PanelRightClose className="h-4 w-4" /> Hide Panel</> : <><PanelRight className="h-4 w-4" /><Bot className="h-4 w-4" /> Timeline</>}
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20 scrollbar-thin">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] lg:max-w-[75%] rounded-xl p-3 ${msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                                    <p className={msg.sender === "user" ? "text-primary-foreground" : "text-foreground"}>{msg.message}</p>
                                    {msg.attachment && (
                                        <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${msg.sender === "user" ? "bg-primary-foreground/10" : "bg-secondary"}`}>
                                            <FileText className="h-5 w-5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{msg.attachment.name}</p>
                                                <p className="text-xs opacity-70">{msg.attachment.size}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                    <p suppressHydrationWarning className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Sticky Input */}
                    <div className="sticky bottom-0 p-3 lg:p-4 border-t bg-card z-10">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,image/*" />
                            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
                            <input
                                type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder={tosAccepted ? "Type your message..." : "Accept Terms of Service to start chatting..."}
                                disabled={!tosAccepted}
                                className="flex-1 h-10 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                            />
                            <Button onClick={handleSend} disabled={!inputValue.trim() || !tosAccepted} size="icon" className="lg:px-4 lg:w-auto">
                                <Send className="h-4 w-4" /><span className="hidden lg:inline ml-2">Send</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                {aiPanelOpen && (
                    <aside className="hidden lg:flex lg:w-[35%] flex-col bg-card border-l overflow-hidden">
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
                                <h3 className="font-semibold text-foreground text-sm">AI Middleman Hub</h3>
                            </div>
                        </div>
                        <SidePanelContent />
                    </aside>
                )}
            </div>

            <AILegalWorkspace
                open={showLegalWorkspace}
                onClose={() => setShowLegalWorkspace(false)}
                factoryName={factory.name}
                initialTab={legalWorkspaceTab}
                chatHistory={messages.map((m) => ({
                    sender: m.sender,
                    message: m.message,
                    timestamp: m.timestamp,
                }))}
                factoryInfo={{
                    factory_id: factory.id,
                    name: factory.name,
                    location: factory.location,
                    category: factory.category,
                    certifications: factory.certifications,
                    rating: factory.rating,
                    verified: factory.verified,
                }}
            />

            <PaymentModal
                open={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                amount={depositAmount}
                factoryName={factory.name}
                totalDealValue={totalDealValue}
            />
            <ContractWarningModal
                open={showContractWarning}
                onClose={() => setShowContractWarning(false)}
                onSkip={() => { setShowContractWarning(false); setShowPaymentModal(true); }}
                onReview={() => { setShowContractWarning(false); openLegalWorkspace("risk"); }}
            />
        </div>
    );
};

export default DealRoom;
