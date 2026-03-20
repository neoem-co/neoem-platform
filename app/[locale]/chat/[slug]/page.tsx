"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { StaticImageData } from "next/image";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
    Send, Paperclip, FileText, Download, Bot,
    Sparkles, FileCheck, AlertTriangle, ChevronRight,
    ArrowLeft, PanelRightClose, PanelRight, Loader2,
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
import { extractContext, type ExtractContextResponse } from "@/lib/ai-api";
import { deriveDealSupervisorState } from "@/lib/deal-supervisor";
import { getFactoryBySlug, getFactoryChatHistory } from "@/lib/factory-data";
import factory1 from "@/public/assets/factory-1.jpg";
import factory2 from "@/public/assets/factory-2.jpg";
import factory3 from "@/public/assets/factory-3.jpg";
import factory4 from "@/public/assets/factory-4.jpg";
import factory5 from "@/public/assets/factory-5.jpg";

const factoryImages: Record<string, StaticImageData> = {
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

interface RiskAlertState {
    level: "critical" | "high" | "medium" | "low" | "safe";
    summary: string;
    highCount: number;
    mediumCount: number;
    lowCount: number;
}

interface DealRoomState {
    tosAccepted: boolean;
    depositPaid: boolean;
    riskAlert: RiskAlertState | null;
    completedActions: string[];
}

function hasCoreDealSheetAutofill(context: ExtractContextResponse | null) {
    const dealSheet = context?.deal_sheet;
    if (!dealSheet) return false;
    return Boolean(
        dealSheet.client?.company &&
        dealSheet.client?.address &&
        dealSheet.vendor?.company &&
        dealSheet.vendor?.address &&
        dealSheet.product?.specs &&
        dealSheet.product?.packaging &&
        dealSheet.delivery_address &&
        (dealSheet.regulatory_terms?.registration_owner || dealSheet.regulatory_terms?.document_support_by),
    );
}

function loadDealRoomState(slug: string): DealRoomState {
    if (typeof window === "undefined") {
        return { tosAccepted: false, depositPaid: false, riskAlert: null, completedActions: [] };
    }

    try {
        const raw = window.localStorage.getItem(`neoem:deal-room:${slug}`);
        if (!raw) return { tosAccepted: false, depositPaid: false, riskAlert: null, completedActions: [] };
        const parsed = JSON.parse(raw) as DealRoomState;
        return {
            tosAccepted: parsed.tosAccepted ?? false,
            depositPaid: parsed.depositPaid ?? false,
            riskAlert: parsed.riskAlert ?? null,
            completedActions: parsed.completedActions ?? [],
        };
    } catch {
        return { tosAccepted: false, depositPaid: false, riskAlert: null, completedActions: [] };
    }
}

const DealRoom = () => {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const locale = useLocale();
    const isThai = locale.startsWith("th");
    const factory = getFactoryBySlug(slug, locale);
    const [showTOS, setShowTOS] = useState(() => !loadDealRoomState(slug).tosAccepted);
    const [tosAccepted, setTosAccepted] = useState(() => loadDealRoomState(slug).tosAccepted);
    const [messages, setMessages] = useState<Message[]>([...getFactoryChatHistory(slug, locale) as Message[]]);
    const [inputValue, setInputValue] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showContractWarning, setShowContractWarning] = useState(false);
    const [mobileAiOpen, setMobileAiOpen] = useState(false);
    const [aiPanelOpen, setAiPanelOpen] = useState(true);
    const [depositPaid, setDepositPaid] = useState(() => loadDealRoomState(slug).depositPaid);
    const [riskAlert, setRiskAlert] = useState<RiskAlertState | null>(() => loadDealRoomState(slug).riskAlert);
    const [completedActions, setCompletedActions] = useState<string[]>(() => loadDealRoomState(slug).completedActions);
    const [trackerResetKey, setTrackerResetKey] = useState(0);
    const [showLegalWorkspace, setShowLegalWorkspace] = useState(false);
    const [legalWorkspaceTab, setLegalWorkspaceTab] = useState<"draft" | "risk" | "history" | "esign">("draft");
    const [liveExtractContext, setLiveExtractContext] = useState<ExtractContextResponse | null>(null);
    const [summaryRefreshing, setSummaryRefreshing] = useState(false);
    const [draftPreparing, setDraftPreparing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const extractContextPromiseRef = useRef<Promise<ExtractContextResponse> | null>(null);

    const hasContractInChat = messages.some((m) => m.attachment?.type === "application/pdf");
    const depositAmount = 36000;
    const totalDealValue = 120000;
    const liveDealSheet = liveExtractContext?.deal_sheet || null;
    const supervisor = deriveDealSupervisorState({
        extractContext: liveExtractContext,
        riskAlert,
        depositPaid,
        completedActions,
        hasContractInChat,
        isThai,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const nextState = loadDealRoomState(slug);
        setShowTOS(!nextState.tosAccepted);
        setTosAccepted(nextState.tosAccepted);
        setMessages([...getFactoryChatHistory(slug, locale) as Message[]]);
        setDepositPaid(nextState.depositPaid);
        setRiskAlert(nextState.riskAlert);
        setCompletedActions(nextState.completedActions);
        setShowLegalWorkspace(false);
        setLegalWorkspaceTab("draft");
        setLiveExtractContext(null);
        setSummaryRefreshing(false);
        setTrackerResetKey((prev) => prev + 1);
    }, [locale, slug]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(`neoem:deal-room:${slug}`, JSON.stringify({
            tosAccepted,
            depositPaid,
            riskAlert,
            completedActions,
        }));
    }, [completedActions, depositPaid, riskAlert, slug, tosAccepted]);

    const ensureExtractContext = useCallback(async (forceRefresh = false) => {
        if (!factory) {
            throw new Error("Factory not found");
        }
        if (extractContextPromiseRef.current && !forceRefresh) {
            return extractContextPromiseRef.current;
        }

        setSummaryRefreshing(true);
        const promise = extractContext(
            messages.map((m) => ({
                sender: m.sender,
                message: m.message,
                timestamp: m.timestamp,
            })),
            factory.name,
            factory.id,
            { forceRefresh },
        );
        extractContextPromiseRef.current = promise;

        try {
            const context = await promise;
            setLiveExtractContext(context);
            return context;
        } finally {
            if (extractContextPromiseRef.current === promise) {
                extractContextPromiseRef.current = null;
            }
            setSummaryRefreshing(false);
        }
    }, [factory, messages]);

    useEffect(() => {
        if (!factory) return;
        let active = true;
        const timer = window.setTimeout(() => {
            ensureExtractContext().catch(() => {
                if (active) {
                    setLiveExtractContext(null);
                }
            });
        }, 150);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [factory, ensureExtractContext]);

    const markActionCompleted = (action: string) => {
        setCompletedActions((prev) => (prev.includes(action) ? prev : [...prev, action]));
    };

    const resetDealProgress = () => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(`neoem:milestones:${slug}`);
        }
        setDepositPaid(false);
        setRiskAlert(null);
        setCompletedActions([]);
        setShowPaymentModal(false);
        setShowContractWarning(false);
        setTrackerResetKey((prev) => prev + 1);
    };

    const handleTOSAccept = () => { setTosAccepted(true); setShowTOS(false); };

    if (!factory) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-20 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Factory not found</h1>
                    <Link href={`/${locale}/factories`} className="text-primary hover:underline mt-4 inline-block">Browse all factories</Link>
                </div>
            </div>
        );
    }

    const imageUrl = factoryImages[factory.image] || factory1;
    const imageSrc = typeof imageUrl === "string" ? imageUrl : imageUrl.src;

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
        if (tab === "draft") {
            if (!hasCoreDealSheetAutofill(liveExtractContext)) {
                setDraftPreparing(true);
                void ensureExtractContext()
                    .then((context) => {
                        if (!hasCoreDealSheetAutofill(context)) {
                            return ensureExtractContext(true);
                        }
                        return context;
                    })
                    .catch(() => {
                        setLiveExtractContext(null);
                    })
                    .finally(() => {
                        setDraftPreparing(false);
                    });
            }
        }
        setLegalWorkspaceTab(tab);
        setShowLegalWorkspace(true);
    };

    const handlePayDeposit = () => {
        if (riskAlert && (riskAlert.level === "critical" || riskAlert.level === "high")) {
            setShowContractWarning(true);
            return;
        }
        if (hasContractInChat) setShowContractWarning(true);
        else setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setDepositPaid(true);
        router.push(`/${locale}/legal-nudge`);
    };

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
            case "launchpad": router.push(`/${locale}/brand-launchpad`); break;
        }
    };

    const sidePanelContent = (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
                <MilestoneTracker
                    key={trackerResetKey}
                    onAction={handleMilestoneAction}
                    storageKey={`neoem:milestones:${slug}`}
                    riskAlert={riskAlert}
                    depositPaid={depositPaid}
                    completedActions={completedActions}
                />

                {riskAlert && (riskAlert.level === "critical" || riskAlert.level === "high") && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-4 w-4" /> {isThai ? "คำเตือนก่อนชำระเงิน" : "Payment Warning"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-3 text-sm text-muted-foreground">
                            <p className="text-destructive font-medium">
                                {isThai
                                    ? "ตรวจพบข้อสัญญาที่มีความเสี่ยงสูงจากการรีวิวสัญญา"
                                    : "High-risk clauses were detected in the contract review."}
                            </p>
                            <p className="mt-1">{riskAlert.summary}</p>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" /> {isThai ? "AI Middleman" : "AI Middleman"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 text-sm text-muted-foreground">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">{isThai ? "สถานะดีลปัจจุบัน" : "Current Deal State"}</p>
                        <p className="mt-1 font-medium text-foreground">{supervisor.currentState}</p>
                        <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground/80">{isThai ? "ขั้นตอนถัดไปที่แนะนำ" : "Next Best Action"}</p>
                        <p className="mt-1 font-medium text-foreground">{supervisor.nextAction}</p>
                        {summaryRefreshing && <p className="mt-2 text-xs text-primary">{isThai ? "กำลังอัปเดตสรุป..." : "Updating summary..."}</p>}
                        {draftPreparing && (
                            <div className="mt-3 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>{isThai ? "กำลังดึง DealSheet จากบทสนทนาเพื่อเตรียมร่างสัญญา..." : "Extracting the DealSheet from chat to prepare the draft..."}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">{isThai ? "สรุปดีล" : "Deal Summary"}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 text-sm text-muted-foreground space-y-2">
                        {supervisor.summaryItems.length > 0 ? supervisor.summaryItems.map((item) => (
                            <p key={item.label}>
                                <strong className="text-foreground">{item.label}:</strong> {item.value}
                            </p>
                        )) : (
                            <p>{isThai ? "กำลังรอบริบทจากบทสนทนาเพิ่มเติมเพื่อสร้างสรุปดีล" : "Waiting for enough chat context to build the live summary."}</p>
                        )}
                        <p><strong className="text-foreground">{isThai ? "จำนวน:" : "Quantity:"}</strong> {liveDealSheet?.product?.quantity ? liveDealSheet.product.quantity.toLocaleString() : "-"} {liveDealSheet?.product?.unit || ""}</p>
                        <p><strong className="text-foreground">{isThai ? "มูลค่ารวม:" : "Total:"}</strong> {typeof liveDealSheet?.total_price === "number" ? `฿${liveDealSheet.total_price.toLocaleString()}` : "-"}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">{isThai ? "เอกสาร / การอนุมัติที่ค้างอยู่" : "Pending Documents / Approvals"}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 text-sm text-muted-foreground space-y-2">
                        {supervisor.pendingItems.length > 0 ? supervisor.pendingItems.map((item) => (
                            <p key={item}>• {item}</p>
                        )) : (
                            <p>{isThai ? "ข้อมูลหลักของดีลถูกจับได้ค่อนข้างครบแล้ว" : "Core deal information looks captured."}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className={supervisor.blockers.length > 0 ? "border-warning/30 bg-warning/5" : ""}>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">{isThai ? "ความเสี่ยง / สิ่งที่ติดค้าง" : "Risks / Blockers"}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3 text-sm text-muted-foreground space-y-2">
                        {supervisor.blockers.length > 0 ? supervisor.blockers.map((item) => (
                            <p key={item}>• {item}</p>
                        )) : (
                            <p>{isThai ? "ยังไม่พบประเด็นที่บล็อกดีลในตอนนี้" : "No active blockers detected right now."}</p>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{isThai ? "คำสั่งด่วน" : "Quick Actions"}</p>
                    <Button className="w-full justify-start text-xs h-8" onClick={() => openLegalWorkspace("draft")}>
                        <FileCheck className="h-3.5 w-3.5 mr-2" /> {isThai ? "ร่างสัญญา" : "Draft Contract"}
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs h-8" onClick={() => openLegalWorkspace("risk")}>
                        <AlertTriangle className="h-3.5 w-3.5 mr-2 text-warning" /> {isThai ? "ตรวจความเสี่ยง" : "Check Risks"}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-xs h-8 text-muted-foreground" onClick={() => openLegalWorkspace("history")}>
                        <FileText className="h-3.5 w-3.5 mr-2" /> {isThai ? "ศูนย์เอกสารกฎหมาย" : "Legal Hub"}
                    </Button>
                </div>

                <Card className="bg-secondary/30 border-dashed">
                    <CardContent className="py-3 space-y-3">
                        <p className="text-xs text-muted-foreground">
                            {isThai
                                ? "💡 ทั้งคุณและโรงงานจะเห็นสถานะ milestone เดียวกันแบบเรียลไทม์ เพื่อให้ทุกขั้นตอนโปร่งใส"
                                : "💡 Both you and the factory see the same milestone status in real-time for full transparency."}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs"
                            onClick={resetDealProgress}
                        >
                            {isThai ? "รีเซ็ตเดโมกลับไปขั้นที่ 3" : "Reset Demo to Step 3"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <StickyPaymentWidget
                currentMilestone="1st Payment (Deposit 30%)"
                amount={depositAmount}
                status={depositPaid ? "paid" : "pending"}
                onPay={handlePayDeposit}
                warningMessage={
                    riskAlert && (riskAlert.level === "critical" || riskAlert.level === "high")
                        ? (isThai
                            ? "พบประเด็นความเสี่ยงสูงในสัญญา กรุณาตรวจคำเตือนทางกฎหมายก่อนชำระเงิน"
                            : "High-risk contract issues found. Review the legal warnings before releasing payment.")
                        : null
                }
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
                        <Link href={`/${locale}/factory/${slug}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden"><img src={imageSrc} alt={factory.name} className="w-full h-full object-cover" /></div>
                            <div>
                                <h2 className="font-semibold text-foreground text-sm">{factory.name}</h2>
                                <p className="text-[10px] text-success">● Online</p>
                            </div>
                        </div>
                    </div>
                    <Sheet open={mobileAiOpen} onOpenChange={setMobileAiOpen}>
                        <SheetTrigger asChild><Button variant="outline" size="sm"><Bot className="h-4 w-4 mr-1" /> {isThai ? "ไทม์ไลน์" : "Timeline"}</Button></SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
                            <SheetHeader><SheetTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> {isThai ? "AI Middleman" : "AI Middleman"}</SheetTitle></SheetHeader>
                            {sidePanelContent}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Breadcrumb */}
            <div className="hidden lg:block border-b">
                <div className="container py-3">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href={`/${locale}/`} className="hover:text-foreground">Home</Link><ChevronRight className="h-4 w-4" />
                        <Link href={`/${locale}/factories`} className="hover:text-foreground">Factories</Link><ChevronRight className="h-4 w-4" />
                        <Link href={`/${locale}/factory/${slug}`} className="hover:text-foreground">{factory.name}</Link><ChevronRight className="h-4 w-4" />
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
                            <div className="w-10 h-10 rounded-full overflow-hidden"><img src={imageSrc} alt={factory.name} className="w-full h-full object-cover" /></div>
                            <div>
                                <h2 className="font-semibold text-foreground">{factory.name}</h2>
                                <p className="text-xs text-success">● Online</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setAiPanelOpen(!aiPanelOpen)} className="flex items-center gap-2">
                            {aiPanelOpen ? <><PanelRightClose className="h-4 w-4" /> {isThai ? "ซ่อนพาเนล" : "Hide Panel"}</> : <><PanelRight className="h-4 w-4" /><Bot className="h-4 w-4" /> {isThai ? "ไทม์ไลน์" : "Timeline"}</>}
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
                                <h3 className="font-semibold text-foreground text-sm">{isThai ? "AI Middleman" : "AI Middleman"}</h3>
                            </div>
                        </div>
                        {sidePanelContent}
                    </aside>
                )}
            </div>

            <AILegalWorkspace
                open={showLegalWorkspace}
                onClose={() => setShowLegalWorkspace(false)}
                factoryName={factory.name}
                initialTab={legalWorkspaceTab}
                initialExtractContext={liveExtractContext}
                managedExtractContext
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
                onDraftComplete={() => markActionCompleted("draft")}
                onRiskAnalysisComplete={(result) => {
                    markActionCompleted("risk");
                    setRiskAlert({
                        level: result.overallRisk,
                        summary: result.summary,
                        highCount: result.highCount,
                        mediumCount: result.mediumCount,
                        lowCount: result.lowCount,
                    });
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
                riskLevel={riskAlert?.level ?? null}
                riskSummary={riskAlert?.summary ?? null}
            />
        </div>
    );
};

export default DealRoom;
