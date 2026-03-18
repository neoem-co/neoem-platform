"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import {
    CheckCircle2, Circle, Clock, FileText, Download,
    Package, MessageSquare, Bell, ChevronRight,
    CreditCard, AlertCircle, ShoppingCart, DollarSign, Activity,
    LayoutDashboard, Scale, Truck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AILegalWorkspace } from "@/components/legal/AILegalWorkspace";
import { ChatSelectorPopup } from "@/components/deal/ChatSelectorPopup";
import factoryHero from "@/public/assets/factory-hero.jpg";

// Mock data
const mockOrders = [
    {
        id: "NEO-2026-001", factory: "International Laboratories Corp. Ltd. (ILC)", product: "Sunscreen SPF50 - Mousse Formula",
        quantity: "1,000 pcs", totalValue: 120000, status: "production", paymentStatus: "escrow-funded",
        lastUpdated: "2 hours ago", thumbnail: factoryHero, slug: "ilc-cosmetics",
        payments: { deposit: { amount: 36000, status: "paid", date: "Jan 4, 2026" }, production: { amount: 48000, status: "pending", date: null }, final: { amount: 36000, status: "locked", date: null } },
        currentStep: 2,
    },
    {
        id: "NEO-2026-002", factory: "Milott Laboratories Co., Ltd.", product: "Anti-Aging Serum 30ml",
        quantity: "500 pcs", totalValue: 75000, status: "deposit", paymentStatus: "deposit-pending",
        lastUpdated: "1 day ago", thumbnail: factoryHero, slug: "milott-laboratories",
        payments: { deposit: { amount: 22500, status: "pending", date: null }, production: { amount: 30000, status: "locked", date: null }, final: { amount: 22500, status: "locked", date: null } },
        currentStep: 1,
    },
    {
        id: "NEO-2026-003", factory: "S & J International Enterprises PCL", product: "Turmeric Supplement Capsules",
        quantity: "2,000 pcs", totalValue: 180000, status: "completed", paymentStatus: "released",
        lastUpdated: "Jan 15, 2026", thumbnail: factoryHero, slug: "sji-cosmetics",
        payments: { deposit: { amount: 54000, status: "paid", date: "Dec 10, 2025" }, production: { amount: 72000, status: "paid", date: "Dec 25, 2025" }, final: { amount: 54000, status: "paid", date: "Jan 15, 2026" } },
        currentStep: 5,
    },
];

const steps = [
    { id: 1, label: "Deposit", status: "completed" },
    { id: 2, label: "Sourcing", status: "current" },
    { id: 3, label: "Production", status: "pending" },
    { id: 4, label: "QC", status: "pending" },
    { id: 5, label: "Delivery", status: "pending" },
];

const documents = [
    { name: "Contract.pdf", size: "245 KB", date: "Jan 4, 2026" },
    { name: "Quotation_Sunscreen_SPF50.pdf", size: "180 KB", date: "Jan 4, 2026" },
    { name: "Payment_Receipt.pdf", size: "95 KB", date: "Jan 4, 2026" },
];

const updates = [
    { id: 1, message: "Raw materials sourcing in progress. ETA: 3 days.", timestamp: "2 hours ago" },
    { id: 2, message: "Deposit payment confirmed. Production will begin shortly.", timestamp: "Yesterday" },
    { id: 3, message: "Contract signed by both parties.", timestamp: "Jan 4, 2026" },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case "deposit": return <Badge variant="outline" className="text-warning border-warning">Awaiting Deposit</Badge>;
        case "production": return <Badge variant="outline" className="text-primary border-primary">In Production</Badge>;
        case "shipping": return <Badge variant="outline" className="text-primary border-primary">Shipping</Badge>;
        case "completed": return <Badge variant="outline" className="text-success border-success">Completed</Badge>;
        default: return null;
    }
};

const getPaymentStatusBadge = (status: string) => {
    switch (status) {
        case "deposit-pending": return <Badge variant="outline" className="text-warning border-warning text-xs">Deposit Pending</Badge>;
        case "escrow-funded": return <Badge variant="outline" className="text-primary border-primary text-xs">Escrow Funded</Badge>;
        case "released": return <Badge variant="outline" className="text-success border-success text-xs">Released</Badge>;
        default: return null;
    }
};

type Order = typeof mockOrders[0];
type MenuKey = "overview" | "orders" | "legal" | "messages";

const sidebarMenu: { key: MenuKey; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "orders", label: "My Orders", icon: ShoppingCart },
    { key: "legal", label: "Legal Hub", icon: Scale },
    { key: "messages", label: "Messages", icon: MessageSquare },
];

const totalOrders = mockOrders.length;
const totalSpent = mockOrders.reduce((sum, o) => sum + o.totalValue, 0);
const activeOrders = mockOrders.filter(o => o.status !== "completed").length;
const completedOrders = mockOrders.filter(o => o.status === "completed").length;

const Dashboard = () => {
    const locale = useLocale();
    const router = useRouter();
    const t = useTranslations("Dashboard");
    const [activeMenu, setActiveMenu] = useState<MenuKey>("overview");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [view, setView] = useState<"list" | "detail">("list");
    const [showLegalWorkspace, setShowLegalWorkspace] = useState(false);
    const [legalTab, setLegalTab] = useState<"draft" | "risk" | "history" | "esign">("draft");
    const [showChatSelector, setShowChatSelector] = useState(false);

    const handleSelectOrder = (order: Order) => { setSelectedOrder(order); setView("detail"); };
    const handleBackToList = () => { setView("list"); setSelectedOrder(null); };

    const currentStep = steps.findIndex((s) => s.status === "current") + 1;
    const progress = (currentStep / steps.length) * 100;

    const openLegalHub = (tab: "draft" | "risk" | "history" | "esign") => {
        setLegalTab(tab);
        // When accessed standalone, prompt chat selection
        setShowChatSelector(true);
    };

    const handleChatSelected = (slug: string) => {
        setShowChatSelector(false);
        setShowLegalWorkspace(true);
    };

    // ── Overview Panel ──
    const OverviewPanel = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-xl font-bold text-foreground">{totalOrders}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-success" /></div><div><p className="text-xs text-muted-foreground">Total Spent</p><p className="text-xl font-bold text-foreground">฿{totalSpent.toLocaleString()}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center"><Activity className="h-5 w-5 text-warning" /></div><div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-foreground">{activeOrders}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-success" /></div><div><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold text-foreground">{completedOrders}</p></div></div></CardContent></Card>
            </div>

            {/* Order Status Summary */}
            <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">{t("orderStatus")}</CardTitle></CardHeader>
                <CardContent className="pb-4">
                    <div className="space-y-3">
                        {mockOrders.map((order) => (
                            <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => { setActiveMenu("orders"); handleSelectOrder(order); }}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{order.id}</span>
                                    <span className="text-xs text-muted-foreground">• {order.factory}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(order.status)}
                                    {getPaymentStatusBadge(order.paymentStatus)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-3">
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => openLegalHub("draft")}>
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-xs">{t("draftContract")}</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => openLegalHub("risk")}>
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <span className="text-xs">{t("checkRisks")}</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => router.push(`/${locale}/brand-launchpad`)}>
                    <Package className="h-5 w-5 text-success" />
                    <span className="text-xs">{t("brandLaunchpad")}</span>
                </Button>
            </div>
        </div>
    );

    // ── Orders Panel ──
    const OrdersPanel = () => {
        if (view === "detail" && selectedOrder) {
            return (
                <div className="space-y-6">
                    <Button variant="ghost" size="sm" onClick={handleBackToList}>← {t("backToOrders")}</Button>

                    <Card>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-6 w-6 text-primary" /></div>
                                <div className="min-w-0">
                                    <h2 className="font-semibold text-foreground text-sm md:text-base truncate">{selectedOrder.product}</h2>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.id} • {selectedOrder.factory}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t">
                                <div><p className="text-xs text-muted-foreground">{t("quantity")}</p><p className="font-semibold text-foreground text-sm">{selectedOrder.quantity}</p></div>
                                <div><p className="text-xs text-muted-foreground">{t("totalValue")}</p><p className="font-semibold text-foreground text-sm">฿{selectedOrder.totalValue.toLocaleString()}</p></div>
                                <div><p className="text-xs text-muted-foreground">{t("estDelivery")}</p><p className="font-semibold text-foreground text-sm">Feb 15, 2026</p></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Milestone Payment Tracker */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Milestone Payments</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { label: "Deposit (30%)", data: selectedOrder.payments.deposit },
                                    { label: "Production (40%)", data: selectedOrder.payments.production },
                                    { label: "Final / QC (30%)", data: selectedOrder.payments.final },
                                ].map((stage) => (
                                    <div key={stage.label} className={`p-4 rounded-lg border-2 ${stage.data.status === "paid" ? "border-success bg-success/5" :
                                        stage.data.status === "pending" ? "border-warning bg-warning/5" : "border-muted bg-muted/20"
                                        }`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {stage.data.status === "paid" ? <CheckCircle2 className="h-6 w-6 text-success" /> :
                                                    stage.data.status === "pending" ? <AlertCircle className="h-6 w-6 text-warning" /> :
                                                        <Circle className="h-6 w-6 text-muted-foreground" />}
                                                <div>
                                                    <p className="font-medium text-foreground">{stage.label}</p>
                                                    <p className="text-sm text-muted-foreground">฿{stage.data.amount.toLocaleString()}{stage.data.date && ` • ${stage.data.date}`}</p>
                                                </div>
                                            </div>
                                            {stage.data.status === "paid" ? <Badge variant="outline" className="text-success border-success">Paid</Badge> :
                                                stage.data.status === "pending" ? <Button size="sm">Pay Now</Button> :
                                                    <Badge variant="outline" className="text-muted-foreground">Locked</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Production Status */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">Production Status</CardTitle></CardHeader>
                        <CardContent>
                            <Progress value={progress} className="h-2 mb-4" />
                            <div className="flex justify-between">
                                {steps.map((step) => (
                                    <div key={step.id} className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.status === "completed" ? "bg-success text-success-foreground" :
                                            step.status === "current" ? "bg-primary text-primary-foreground" :
                                                "bg-muted text-muted-foreground"
                                            }`}>
                                            {step.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> :
                                                step.status === "current" ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                        </div>
                                        <span className={`text-[10px] mt-1 ${step.status !== "pending" ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents & Updates */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Documents</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {documents.map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                            <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.size} • {doc.date}</p></div>
                                        </div>
                                        <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Factory Updates</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {updates.map((update) => (
                                    <div key={update.id} className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                                        <div><p className="text-sm text-foreground">{update.message}</p><p className="text-xs text-muted-foreground mt-1">{update.timestamp}</p></div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-3">
                        <Link href={`/${locale}/chat/${selectedOrder.slug}`} className="flex-1"><Button variant="outline" className="w-full"><MessageSquare className="h-4 w-4 mr-2" /> Open Deal Room</Button></Link>
                        <Link href={`/${locale}/brand-launchpad`} className="flex-1"><Button className="w-full">Brand Launchpad <ChevronRight className="h-4 w-4 ml-2" /></Button></Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {mockOrders.map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectOrder(order)}>
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <NextImage
                                        src={order.thumbnail}
                                        alt={order.product}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                        <div><h3 className="font-semibold text-foreground truncate">{order.product}</h3><p className="text-sm text-muted-foreground">{order.id} • {order.factory}</p></div>
                                        <div className="flex items-center gap-2">{getStatusBadge(order.status)}{getPaymentStatusBadge(order.paymentStatus)}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-3">
                                        <div><p className="text-xs text-muted-foreground">Quantity</p><p className="font-medium text-foreground text-sm">{order.quantity}</p></div>
                                        <div><p className="text-xs text-muted-foreground">Total Value</p><p className="font-medium text-foreground text-sm">฿{order.totalValue.toLocaleString()}</p></div>
                                        <div><p className="text-xs text-muted-foreground">Last Updated</p><p className="font-medium text-foreground text-sm">{order.lastUpdated}</p></div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center"><ChevronRight className="h-5 w-5 text-muted-foreground" /></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    // ── Legal Hub Panel ──
    const LegalPanel = () => (
        <div className="space-y-4">
            <Card><CardContent className="p-6 text-center space-y-4">
                <Scale className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-lg font-semibold text-foreground">{t("aiLegalHub")}</h2>
                <p className="text-sm text-muted-foreground">{t("accessAllLegalTools")}</p>
                <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
                    <Button onClick={() => openLegalHub("draft")} className="h-auto py-3 flex-col gap-1">
                        <FileText className="h-5 w-5" />
                        <span className="text-xs">{t("draftContract")}</span>
                    </Button>
                    <Button variant="outline" onClick={() => openLegalHub("risk")} className="h-auto py-3 flex-col gap-1">
                        <AlertCircle className="h-5 w-5 text-warning" />
                        <span className="text-xs">{t("checkRisks")}</span>
                    </Button>
                    <Button variant="outline" onClick={() => openLegalHub("esign")} className="h-auto py-3 flex-col gap-1">
                        <Scale className="h-5 w-5 text-primary" />
                        <span className="text-xs">{t("eSignature")}</span>
                    </Button>
                    <Button variant="ghost" onClick={() => openLegalHub("history")} className="h-auto py-3 flex-col gap-1">
                        <Clock className="h-5 w-5" />
                        <span className="text-xs">{t("history")}</span>
                    </Button>
                </div>
            </CardContent></Card>
        </div>
    );

    // ── Messages Panel ──
    const MessagesPanel = () => (
        <div className="space-y-4">
            {mockOrders.filter(o => o.status !== "completed").map((order) => (
                <Link href={`/${locale}/chat/${order.slug}`} key={order.id}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{order.factory.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{order.factory}</p>
                                <p className="text-xs text-muted-foreground">{order.product}</p>
                            </div>
                            {getStatusBadge(order.status)}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            <div className="flex-1 flex">
                {/* Left Sidebar */}
                <aside className="hidden lg:flex w-56 flex-col border-r bg-card flex-shrink-0">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-foreground text-sm">{t("businessSuite")}</h2>
                        <p className="text-xs text-muted-foreground">{t("smeDashboard")}</p>
                    </div>
                    <nav className="flex-1 p-2 space-y-0.5">
                        {sidebarMenu.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => { setActiveMenu(item.key); if (item.key === "orders") setView("list"); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeMenu === item.key
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-1 text-left">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="container py-6 md:py-8 max-w-6xl">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                                    {activeMenu === "overview" && "Dashboard"}
                                    {activeMenu === "orders" && "My Orders"}
                                    {activeMenu === "legal" && "Legal Hub"}
                                    {activeMenu === "messages" && "Messages"}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">{t("trackAndManage")}</p>
                            </div>
                            <Button variant="outline" size="sm" className="w-fit"><Bell className="h-4 w-4 mr-2" /> {t("notifications")}</Button>
                        </div>

                        {/* Mobile Menu */}
                        <div className="lg:hidden mb-6 overflow-x-auto">
                            <div className="flex gap-1 pb-2">
                                {sidebarMenu.map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => { setActiveMenu(item.key); if (item.key === "orders") setView("list"); }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${activeMenu === item.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                                            }`}
                                    >
                                        <item.icon className="h-3 w-3" />{item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activeMenu === "overview" && <OverviewPanel />}
                        {activeMenu === "orders" && <OrdersPanel />}
                        {activeMenu === "legal" && <LegalPanel />}
                        {activeMenu === "messages" && <MessagesPanel />}
                    </div>
                </div>
            </div>

            <ChatSelectorPopup
                open={showChatSelector}
                onClose={() => setShowChatSelector(false)}
                onSelect={handleChatSelected}
            />

            <AILegalWorkspace
                open={showLegalWorkspace}
                onClose={() => setShowLegalWorkspace(false)}
                factoryName="Thai Cosmetics Pro"
                initialTab={legalTab}
            />

            <Footer />
        </div>
    );
};

export default Dashboard;
