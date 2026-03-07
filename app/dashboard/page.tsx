"use client";

import { useState } from "react";
import Link from "next/link";
import {
    CheckCircle2, Circle, Clock, FileText, Download,
    Package, Truck, Camera, MessageSquare, Bell, ChevronRight,
    CreditCard, AlertCircle, ShoppingCart, DollarSign, Activity
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import factoryHero from "@/public/assets/factory-hero.jpg";

// Mock orders data
const mockOrders = [
    {
        id: "NEO-2026-001",
        factory: "Thai Cosmetics Pro",
        product: "Sunscreen SPF50 - Mousse Formula",
        quantity: "1,000 pcs",
        totalValue: 120000,
        status: "production",
        paymentStatus: "escrow-funded",
        lastUpdated: "2 hours ago",
        thumbnail: factoryHero,
        payments: {
            deposit: { amount: 36000, status: "paid", date: "Jan 4, 2026" },
            production: { amount: 48000, status: "pending", date: null },
            final: { amount: 36000, status: "locked", date: null },
        },
        currentStep: 2,
    },
    {
        id: "NEO-2026-002",
        factory: "Pure Skin Lab",
        product: "Anti-Aging Serum 30ml",
        quantity: "500 pcs",
        totalValue: 75000,
        status: "deposit",
        paymentStatus: "deposit-pending",
        lastUpdated: "1 day ago",
        thumbnail: factoryHero,
        payments: {
            deposit: { amount: 22500, status: "pending", date: null },
            production: { amount: 30000, status: "locked", date: null },
            final: { amount: 22500, status: "locked", date: null },
        },
        currentStep: 1,
    },
    {
        id: "NEO-2026-003",
        factory: "Siam Herbal Extract",
        product: "Turmeric Supplement Capsules",
        quantity: "2,000 pcs",
        totalValue: 180000,
        status: "completed",
        paymentStatus: "released",
        lastUpdated: "Jan 15, 2026",
        thumbnail: factoryHero,
        payments: {
            deposit: { amount: 54000, status: "paid", date: "Dec 10, 2025" },
            production: { amount: 72000, status: "paid", date: "Dec 25, 2025" },
            final: { amount: 54000, status: "paid", date: "Jan 15, 2026" },
        },
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
    { id: 1, message: "Raw materials sourcing in progress. ETA: 3 days.", timestamp: "2 hours ago", hasImage: false },
    { id: 2, message: "Deposit payment confirmed. Production will begin shortly.", timestamp: "Yesterday", hasImage: false },
    { id: 3, message: "Contract signed by both parties.", timestamp: "Jan 4, 2026", hasImage: false },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case "deposit":
            return <Badge variant="outline" className="text-warning border-warning">Awaiting Deposit</Badge>;
        case "production":
            return <Badge variant="outline" className="text-primary border-primary">In Production</Badge>;
        case "shipping":
            return <Badge variant="outline" className="text-info border-info">Shipping</Badge>;
        case "completed":
            return <Badge variant="outline" className="text-success border-success">Completed</Badge>;
        default:
            return null;
    }
};

const getPaymentStatusBadge = (status: string) => {
    switch (status) {
        case "deposit-pending":
            return <Badge variant="outline" className="text-warning border-warning text-xs">Deposit Pending</Badge>;
        case "escrow-funded":
            return <Badge variant="outline" className="text-primary border-primary text-xs">Escrow Funded</Badge>;
        case "deposit-paid":
            return <Badge variant="outline" className="text-primary border-primary text-xs">Deposit Paid</Badge>;
        case "released":
            return <Badge variant="outline" className="text-success border-success text-xs">Released</Badge>;
        default:
            return null;
    }
};

type Order = typeof mockOrders[0];

// Summary metrics
const totalOrders = mockOrders.length;
const totalSpent = mockOrders.reduce((sum, o) => sum + o.totalValue, 0);
const activeOrders = mockOrders.filter(o => o.status !== "completed").length;
const completedOrders = mockOrders.filter(o => o.status === "completed").length;

const Dashboard = () => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [view, setView] = useState<"list" | "detail">("list");

    const handleSelectOrder = (order: Order) => {
        setSelectedOrder(order);
        setView("detail");
    };

    const handleBackToList = () => {
        setView("list");
        setSelectedOrder(null);
    };

    const currentStep = steps.findIndex((s) => s.status === "current") + 1;
    const progress = (currentStep / steps.length) * 100;

    // Order List View
    if (view === "list") {
        return (
            <div className="min-h-screen bg-secondary/20 flex flex-col">
                <Navbar />

                <div className="container py-4 md:py-8 flex-1">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">My Orders</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Track and manage your manufacturing orders
                            </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-fit">
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                        </Button>
                    </div>

                    {/* Orders Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Orders</p>
                                        <p className="text-xl font-bold text-foreground">{totalOrders}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Spent</p>
                                        <p className="text-xl font-bold text-foreground">฿{totalSpent.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                                        <Activity className="h-5 w-5 text-warning" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Active</p>
                                        <p className="text-xl font-bold text-foreground">{activeOrders}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Completed</p>
                                        <p className="text-xl font-bold text-foreground">{completedOrders}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Status Summary */}
                    <Card className="mb-6">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Order Status</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="space-y-3">
                                {mockOrders.map((order) => (
                                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30">
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

                    {/* Order Cards */}
                    <div className="space-y-4">
                        {mockOrders.map((order) => (
                            <Card
                                key={order.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => handleSelectOrder(order)}
                            >
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Thumbnail */}
                                        <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={order.thumbnail.src}
                                                alt={order.product}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-foreground truncate">{order.product}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.id} • {order.factory}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(order.status)}
                                                    {getPaymentStatusBadge(order.paymentStatus)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mt-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Quantity</p>
                                                    <p className="font-medium text-foreground text-sm">{order.quantity}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total Value</p>
                                                    <p className="font-medium text-foreground text-sm">฿{order.totalValue.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Last Updated</p>
                                                    <p className="font-medium text-foreground text-sm">{order.lastUpdated}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="hidden sm:flex items-center">
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Footer />
            </div>
        );
    }

    // Order Detail View
    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            <div className="container py-4 md:py-8 flex-1">
                {/* Back Button & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={handleBackToList}>
                            ← Back
                        </Button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">Order Details</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {selectedOrder?.id} • {selectedOrder?.factory}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-fit">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </Button>
                </div>

                {/* Order Summary Card */}
                <Card className="mb-6 md:mb-8">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Package className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-semibold text-foreground text-sm md:text-base truncate">
                                        {selectedOrder?.product || "Sunscreen SPF50 - Mousse Formula"}
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                                        {selectedOrder?.id || "Order #NEO-2026-001"} • {selectedOrder?.factory || "Thai Cosmetics Pro"}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 border-t">
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-muted-foreground">Quantity</p>
                                    <p className="font-semibold text-foreground text-sm md:text-base">
                                        {selectedOrder?.quantity || "1,000 pcs"}
                                    </p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-muted-foreground">Total Value</p>
                                    <p className="font-semibold text-foreground text-sm md:text-base">
                                        ฿{selectedOrder?.totalValue?.toLocaleString() || "120,000"}
                                    </p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-muted-foreground">Est. Delivery</p>
                                    <p className="font-semibold text-foreground text-sm md:text-base">Feb 15, 2026</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Milestone Payment Tracker */}
                <Card className="mb-6 md:mb-8">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Milestone Payment Tracker
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Payment Stage 1: Deposit */}
                            <div className={`p-4 rounded-lg border-2 ${selectedOrder?.payments.deposit.status === "paid"
                                ? "border-success bg-success/5"
                                : selectedOrder?.payments.deposit.status === "pending"
                                    ? "border-warning bg-warning/5"
                                    : "border-muted bg-muted/20"
                                }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {selectedOrder?.payments.deposit.status === "paid" ? (
                                            <CheckCircle2 className="h-6 w-6 text-success" />
                                        ) : selectedOrder?.payments.deposit.status === "pending" ? (
                                            <AlertCircle className="h-6 w-6 text-warning" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="font-medium text-foreground">Deposit (30%)</p>
                                            <p className="text-sm text-muted-foreground">
                                                ฿{selectedOrder?.payments.deposit.amount.toLocaleString()}
                                                {selectedOrder?.payments.deposit.date && ` • Paid ${selectedOrder.payments.deposit.date}`}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedOrder?.payments.deposit.status === "paid" ? (
                                        <Badge variant="outline" className="text-success border-success">Paid</Badge>
                                    ) : selectedOrder?.payments.deposit.status === "pending" ? (
                                        <Button size="sm" className="w-full sm:w-auto">Pay Now</Button>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">Locked</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Payment Stage 2 */}
                            <div className={`p-4 rounded-lg border-2 ${selectedOrder?.payments.production.status === "paid"
                                ? "border-success bg-success/5"
                                : selectedOrder?.payments.production.status === "pending"
                                    ? "border-warning bg-warning/5"
                                    : "border-muted bg-muted/20"
                                }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {selectedOrder?.payments.production.status === "paid" ? (
                                            <CheckCircle2 className="h-6 w-6 text-success" />
                                        ) : selectedOrder?.payments.production.status === "pending" ? (
                                            <AlertCircle className="h-6 w-6 text-warning" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="font-medium text-foreground">2nd Installment - Start Production (40%)</p>
                                            <p className="text-sm text-muted-foreground">
                                                ฿{selectedOrder?.payments.production.amount.toLocaleString()}
                                                {selectedOrder?.payments.production.date && ` • Paid ${selectedOrder.payments.production.date}`}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedOrder?.payments.production.status === "paid" ? (
                                        <Badge variant="outline" className="text-success border-success">Paid</Badge>
                                    ) : selectedOrder?.payments.production.status === "pending" ? (
                                        <Button size="sm" className="w-full sm:w-auto">Pay Now</Button>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {selectedOrder?.payments.deposit.status === "pending" ? "Awaiting Deposit" : "Locked"}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Payment Stage 3 */}
                            <div className={`p-4 rounded-lg border-2 ${selectedOrder?.payments.final.status === "paid"
                                ? "border-success bg-success/5"
                                : selectedOrder?.payments.final.status === "pending"
                                    ? "border-warning bg-warning/5"
                                    : "border-muted bg-muted/20"
                                }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {selectedOrder?.payments.final.status === "paid" ? (
                                            <CheckCircle2 className="h-6 w-6 text-success" />
                                        ) : selectedOrder?.payments.final.status === "pending" ? (
                                            <AlertCircle className="h-6 w-6 text-warning" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="font-medium text-foreground">Final Payment - QC Passed (30%)</p>
                                            <p className="text-sm text-muted-foreground">
                                                ฿{selectedOrder?.payments.final.amount.toLocaleString()}
                                                {selectedOrder?.payments.final.date && ` • Paid ${selectedOrder.payments.final.date}`}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedOrder?.payments.final.status === "paid" ? (
                                        <Badge variant="outline" className="text-success border-success">Paid</Badge>
                                    ) : selectedOrder?.payments.final.status === "pending" ? (
                                        <Button size="sm" className="w-full sm:w-auto">Pay Now</Button>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">Awaiting QC Evidence</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Stepper */}
                <Card className="mb-6 md:mb-8">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base md:text-lg">Production Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                Step {currentStep} of {steps.length}
                            </p>
                        </div>
                        <div className="flex justify-between">
                            {steps.map((step) => (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${step.status === "completed" ? "bg-success text-success-foreground" :
                                        step.status === "current" ? "bg-primary text-primary-foreground" :
                                            "bg-muted text-muted-foreground"
                                        }`}>
                                        {step.status === "completed" ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> :
                                            step.status === "current" ? <Clock className="h-4 w-4 md:h-5 md:w-5" /> :
                                                <Circle className="h-4 w-4 md:h-5 md:w-5" />}
                                    </div>
                                    <span className={`text-[10px] md:text-xs mt-1 ${step.status === "completed" || step.status === "current"
                                        ? "text-foreground font-medium" : "text-muted-foreground"
                                        }`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {documents.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">{doc.size} • {doc.date}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Updates */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Factory Updates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {updates.map((update) => (
                                <div key={update.id} className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-foreground">{update.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{update.timestamp}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <Link href="/messages" className="flex-1">
                        <Button variant="outline" className="w-full">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message Factory
                        </Button>
                    </Link>
                    <Link href="/brand-launchpad" className="flex-1">
                        <Button className="w-full">
                            Brand Launchpad
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Dashboard;
