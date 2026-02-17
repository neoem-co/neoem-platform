"use client";

import { useState } from "react";
import Link from "next/link";
import {
    CheckCircle2, Circle, Clock, FileText, Download,
    Package, Truck, Camera, MessageSquare, Bell, ChevronRight,
    CreditCard, AlertCircle
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Mock orders data
const mockOrders = [
    {
        id: "NEO-2026-001",
        factory: "Thai Cosmetics Pro",
        product: "Sunscreen SPF50 - Mousse Formula",
        quantity: "1,000 pcs",
        totalValue: 120000,
        status: "production",
        lastUpdated: "2 hours ago",
        thumbnail: "/assets/factory-hero.jpg",
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
        lastUpdated: "1 day ago",
        thumbnail: "/assets/factory-hero.jpg",
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
        lastUpdated: "Jan 15, 2026",
        thumbnail: "/assets/factory-hero.jpg",
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
    {
        id: 1,
        message: "Raw materials sourcing in progress. ETA: 3 days.",
        timestamp: "2 hours ago",
        hasImage: false,
    },
    {
        id: 2,
        message: "Deposit payment confirmed. Production will begin shortly.",
        timestamp: "Yesterday",
        hasImage: false,
    },
    {
        id: 3,
        message: "Contract signed by both parties.",
        timestamp: "Jan 4, 2026",
        hasImage: false,
    },
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

type Order = typeof mockOrders[0];

export default function Dashboard() {
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

    const currentStepIndex = steps.findIndex((s) => s.status === "current");
    const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 0;
    const progress = steps.length > 0 ? (currentStep / steps.length) * 100 : 0;

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
                                                src={order.thumbnail}
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
                                                {getStatusBadge(order.status)}
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
                                        <Button size="sm" className="w-full sm:w-auto">
                                            Pay Now
                                        </Button>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">Locked</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Payment Stage 2: Production Start */}
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
                                        <Button size="sm" className="w-full sm:w-auto">
                                            Pay Now
                                        </Button>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {selectedOrder?.payments.deposit.status === "pending" ? "Awaiting Deposit" : "Locked"}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Payment Stage 3: Final Payment */}
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
                                        <Button size="sm" className="w-full sm:w-auto">
                                            Pay Now
                                        </Button>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            Awaiting QC Evidence
                                        </Badge>
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
                        </div>

                        {/* Desktop Stepper */}
                        <div className="hidden md:flex items-center justify-between">
                            {steps.map((step) => (
                                <div key={step.id} className="flex flex-col items-center relative">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${step.status === "completed"
                                            ? "stepper-completed"
                                            : step.status === "current"
                                                ? "stepper-active animate-pulse-soft"
                                                : "stepper-pending"
                                            }`}
                                    >
                                        {step.status === "completed" ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : step.status === "current" ? (
                                            <Clock className="h-5 w-5" />
                                        ) : (
                                            <Circle className="h-5 w-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm mt-2 ${step.status === "pending" ? "text-muted-foreground" : "text-foreground font-medium"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                    {step.status === "completed" && (
                                        <span className="text-xs text-success">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Mobile Stepper */}
                        <div className="md:hidden space-y-2">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg ${step.status === "current" ? "bg-primary/10" : ""
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === "completed"
                                            ? "bg-success text-success-foreground"
                                            : step.status === "current"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {step.status === "completed" ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : step.status === "current" ? (
                                            <Clock className="h-4 w-4" />
                                        ) : (
                                            <span className="text-xs">{step.id}</span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm ${step.status === "pending" ? "text-muted-foreground" : "text-foreground font-medium"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                    {step.status === "current" && (
                                        <span className="ml-auto text-xs text-primary">In Progress</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
                    {/* Live Updates */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                <Camera className="h-5 w-5 text-primary" />
                                Production Updates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Production Image */}
                            <div className="rounded-lg overflow-hidden relative">
                                <img
                                    src="/assets/factory-hero.jpg"
                                    alt="Production line"
                                    className="w-full h-36 md:h-48 object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-foreground/80 text-background px-2 py-1 rounded text-xs">
                                    Live from factory floor
                                </div>
                            </div>

                            {/* Updates Feed */}
                            <div className="space-y-3">
                                {updates.map((update) => (
                                    <div key={update.id} className="flex gap-3 p-3 bg-secondary/50 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground">{update.message}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{update.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/chat/thai-cosmetics-pro">
                                <Button variant="outline" className="w-full">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Message Factory
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Document Wallet */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Document Wallet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {documents.map((doc) => (
                                <div
                                    key={doc.name}
                                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground text-sm truncate">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {doc.size} • {doc.date}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <div className="pt-4 border-t">
                                <Button variant="outline" className="w-full">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Upload Document
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
                    <Card>
                        <CardContent className="p-3 md:p-4 text-center">
                            <p className="text-xl md:text-2xl font-bold text-primary">30%</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Deposit Paid</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 md:p-4 text-center">
                            <p className="text-xl md:text-2xl font-bold text-foreground">42</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Days to Delivery</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 md:p-4 text-center">
                            <p className="text-xl md:text-2xl font-bold text-success">On Track</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Status</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 md:p-4 text-center">
                            <p className="text-xl md:text-2xl font-bold text-foreground">3</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Documents</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
}
