"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Package, Eye, TrendingUp, MessageSquare, FileText, Download,
    Clock, CheckCircle2, Loader2, Plus, ChevronRight, ChevronLeft,
    Upload, User, Box, DollarSign, FileCheck
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const stats = [
    { label: "Total Orders", value: "23", icon: Package, change: "+5 this month" },
    { label: "Revenue (Month)", value: "฿ 1.2M", icon: TrendingUp, change: "+12%" },
    { label: "Profile Views", value: "1,234", icon: Eye, change: "+8% this week" },
];

const recentChats = [
    { id: 1, name: "Beauty Brand Co.", lastMessage: "Can you send samples?", time: "2h ago", unread: true },
    { id: 2, name: "Thai Wellness Ltd.", lastMessage: "Thank you for the quote!", time: "5h ago", unread: false },
    { id: 3, name: "Glow Skincare", lastMessage: "When can you start production?", time: "1d ago", unread: false },
];

const orders = [
    { id: "NEO-001", customer: "Beauty Brand Co.", product: "Serum 30ml", quantity: "2,000 pcs", status: "pending", amount: "฿180,000" },
    { id: "NEO-002", customer: "Thai Wellness Ltd.", product: "Cream 50g", quantity: "1,500 pcs", status: "production", amount: "฿225,000" },
    { id: "NEO-003", customer: "Glow Skincare", product: "Toner 100ml", quantity: "3,000 pcs", status: "shipping", amount: "฿90,000" },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case "pending":
            return <Badge variant="outline" className="text-warning border-warning"><Clock className="h-3 w-3 mr-1" />Pending Deposit</Badge>;
        case "production":
            return <Badge variant="outline" className="text-primary border-primary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Production</Badge>;
        case "shipping":
            return <Badge variant="outline" className="text-success border-success"><CheckCircle2 className="h-3 w-3 mr-1" />Shipping</Badge>;
        default:
            return null;
    }
};

interface QuotationFormData {
    // Step 1: Customer Info
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    companyName: string;
    // Step 2: Product Specs
    productCategory: string;
    productName: string;
    productDescription: string;
    referenceImage: string;
    ingredients: string;
    // Step 3: Costing
    materialCost: string;
    laborCost: string;
    profitMargin: string;
    moqTier1: string;
    moqTier1Price: string;
    moqTier2: string;
    moqTier2Price: string;
    moqTier3: string;
    moqTier3Price: string;
    // Step 4: Terms
    paymentTerms: string;
    leadTime: string;
    validityPeriod: string;
    notes: string;
}

const initialFormData: QuotationFormData = {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    companyName: "",
    productCategory: "",
    productName: "",
    productDescription: "",
    referenceImage: "",
    ingredients: "",
    materialCost: "",
    laborCost: "",
    profitMargin: "",
    moqTier1: "500",
    moqTier1Price: "",
    moqTier2: "1000",
    moqTier2Price: "",
    moqTier3: "5000",
    moqTier3Price: "",
    paymentTerms: "",
    leadTime: "",
    validityPeriod: "30",
    notes: "",
};

export default function OEMDashboard() {
    const [wizardStep, setWizardStep] = useState(1);
    const [quotationForm, setQuotationForm] = useState<QuotationFormData>(initialFormData);
    const [generating, setGenerating] = useState(false);
    const [quotationGenerated, setQuotationGenerated] = useState(false);

    const updateForm = (field: keyof QuotationFormData, value: string) => {
        setQuotationForm(prev => ({ ...prev, [field]: value }));
    };

    const handleNextStep = () => {
        if (wizardStep < 4) setWizardStep(wizardStep + 1);
    };

    const handlePrevStep = () => {
        if (wizardStep > 1) setWizardStep(wizardStep - 1);
    };

    const handleGenerateQuotation = async () => {
        setGenerating(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setGenerating(false);
        setQuotationGenerated(true);
    };

    const handleResetWizard = () => {
        setWizardStep(1);
        setQuotationForm(initialFormData);
        setQuotationGenerated(false);
    };

    const wizardSteps = [
        { number: 1, title: "Customer Info", icon: User },
        { number: 2, title: "Product Specs", icon: Box },
        { number: 3, title: "Costing", icon: DollarSign },
        { number: 4, title: "Terms", icon: FileCheck },
    ];

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            <div className="container py-6 md:py-8 flex-1">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Factory Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, Thai Cosmetics Pro</p>
                    </div>
                    <Link href="/pricing">
                        <Button variant="outline">
                            Upgrade Plan
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
                    {stats.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                                        <p className="text-xs text-success mt-1">{stat.change}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <stat.icon className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="quotation">AI Quotation Tool</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Recent Chats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        Recent Chats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {recentChats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary">
                                                    {chat.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-foreground truncate">{chat.name}</p>
                                                    {chat.unread && (
                                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Order Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        Active Orders
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {orders.slice(0, 3).map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground truncate">{order.customer}</p>
                                                <p className="text-sm text-muted-foreground">{order.product}</p>
                                            </div>
                                            {getStatusBadge(order.status)}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="orders">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Order Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Mobile Card View */}
                                <div className="space-y-4 md:hidden">
                                    {orders.map((order) => (
                                        <Card key={order.id} className="bg-secondary/30">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-foreground">{order.id}</span>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <p><span className="text-muted-foreground">Customer:</span> {order.customer}</p>
                                                    <p><span className="text-muted-foreground">Product:</span> {order.product}</p>
                                                    <p><span className="text-muted-foreground">Quantity:</span> {order.quantity}</p>
                                                    <p><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">{order.amount}</span></p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order ID</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id} className="border-b hover:bg-secondary/30">
                                                    <td className="py-3 px-4 text-sm font-medium text-foreground">{order.id}</td>
                                                    <td className="py-3 px-4 text-sm text-foreground">{order.customer}</td>
                                                    <td className="py-3 px-4 text-sm text-muted-foreground">{order.product}</td>
                                                    <td className="py-3 px-4 text-sm text-muted-foreground">{order.quantity}</td>
                                                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                                                    <td className="py-3 px-4 text-sm text-right font-semibold text-foreground">{order.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quotation">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    AI Quotation Generator
                                </CardTitle>
                                <CardDescription>
                                    Create professional PDF quotations in 4 easy steps
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {quotationGenerated ? (
                                    // Success State
                                    <div className="space-y-6">
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="h-8 w-8 text-success" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground mb-2">Quotation Generated!</h3>
                                            <p className="text-muted-foreground">Your professional quotation is ready to download or send</p>
                                        </div>

                                        <div className="p-4 bg-success/10 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-success" />
                                                <div>
                                                    <p className="font-medium text-foreground">Quotation_{quotationForm.productName || "Product"}.pdf</p>
                                                    <p className="text-xs text-muted-foreground">Generated just now • 85 KB</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                </Button>
                                                <Button size="sm">
                                                    Send to Chat
                                                </Button>
                                            </div>
                                        </div>

                                        <Button variant="outline" className="w-full" onClick={handleResetWizard}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New Quotation
                                        </Button>
                                    </div>
                                ) : (
                                    // Wizard Steps
                                    <div className="space-y-6">
                                        {/* Step Indicator */}
                                        <div className="flex items-center justify-between mb-8">
                                            {wizardSteps.map((step, index) => (
                                                <div key={step.number} className="flex items-center">
                                                    <div className={`flex flex-col items-center ${index > 0 ? "flex-1" : ""}`}>
                                                        {index > 0 && (
                                                            <div className={`hidden sm:block h-0.5 w-full mb-4 ${wizardStep > index ? "bg-primary" : "bg-muted"
                                                                }`} />
                                                        )}
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wizardStep === step.number
                                                            ? "bg-primary text-primary-foreground"
                                                            : wizardStep > step.number
                                                                ? "bg-success text-success-foreground"
                                                                : "bg-muted text-muted-foreground"
                                                            }`}>
                                                            {wizardStep > step.number ? (
                                                                <CheckCircle2 className="h-5 w-5" />
                                                            ) : (
                                                                <step.icon className="h-5 w-5" />
                                                            )}
                                                        </div>
                                                        <span className={`text-xs mt-2 hidden sm:block ${wizardStep === step.number ? "text-primary font-medium" : "text-muted-foreground"
                                                            }`}>
                                                            {step.title}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Step 1: Customer Info */}
                                        {wizardStep === 1 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    <User className="h-5 w-5 text-primary" />
                                                    Step 1: Customer Information
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customerName">Customer Name *</Label>
                                                        <Input
                                                            id="customerName"
                                                            placeholder="John Doe"
                                                            value={quotationForm.customerName}
                                                            onChange={(e) => updateForm("customerName", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="companyName">Company Name</Label>
                                                        <Input
                                                            id="companyName"
                                                            placeholder="Beauty Brand Co."
                                                            value={quotationForm.companyName}
                                                            onChange={(e) => updateForm("companyName", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customerEmail">Email *</Label>
                                                        <Input
                                                            id="customerEmail"
                                                            type="email"
                                                            placeholder="john@example.com"
                                                            value={quotationForm.customerEmail}
                                                            onChange={(e) => updateForm("customerEmail", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="customerPhone">Phone</Label>
                                                        <Input
                                                            id="customerPhone"
                                                            placeholder="08X-XXX-XXXX"
                                                            value={quotationForm.customerPhone}
                                                            onChange={(e) => updateForm("customerPhone", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 2: Product Specs */}
                                        {wizardStep === 2 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    <Box className="h-5 w-5 text-primary" />
                                                    Step 2: Product Specifications
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="productCategory">Product Category *</Label>
                                                        <Select
                                                            value={quotationForm.productCategory}
                                                            onValueChange={(v) => updateForm("productCategory", v)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="skincare">Skincare</SelectItem>
                                                                <SelectItem value="cosmetics">Cosmetics</SelectItem>
                                                                <SelectItem value="supplements">Supplements</SelectItem>
                                                                <SelectItem value="haircare">Hair Care</SelectItem>
                                                                <SelectItem value="bodycare">Body Care</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="productName">Product Name *</Label>
                                                        <Input
                                                            id="productName"
                                                            placeholder="e.g., Sunscreen SPF50"
                                                            value={quotationForm.productName}
                                                            onChange={(e) => updateForm("productName", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="productDescription">Product Description</Label>
                                                    <Textarea
                                                        id="productDescription"
                                                        placeholder="Describe the product specifications, packaging size, etc."
                                                        value={quotationForm.productDescription}
                                                        onChange={(e) => updateForm("productDescription", e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ingredients">Key Ingredients / Materials</Label>
                                                    <Textarea
                                                        id="ingredients"
                                                        placeholder="List main ingredients or materials"
                                                        value={quotationForm.ingredients}
                                                        onChange={(e) => updateForm("ingredients", e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Reference Image (Optional)</Label>
                                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-secondary/30 transition-colors cursor-pointer">
                                                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Click to upload or drag and drop
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            PNG, JPG up to 5MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3: Costing */}
                                        {wizardStep === 3 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    <DollarSign className="h-5 w-5 text-primary" />
                                                    Step 3: Costing & MOQ Tiers
                                                </h3>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="materialCost">Material Cost (฿/unit)</Label>
                                                        <Input
                                                            id="materialCost"
                                                            type="number"
                                                            placeholder="e.g., 50"
                                                            value={quotationForm.materialCost}
                                                            onChange={(e) => updateForm("materialCost", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="laborCost">Labor Cost (฿/unit)</Label>
                                                        <Input
                                                            id="laborCost"
                                                            type="number"
                                                            placeholder="e.g., 20"
                                                            value={quotationForm.laborCost}
                                                            onChange={(e) => updateForm("laborCost", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                                                        <Input
                                                            id="profitMargin"
                                                            type="number"
                                                            placeholder="e.g., 30"
                                                            value={quotationForm.profitMargin}
                                                            onChange={(e) => updateForm("profitMargin", e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-6">
                                                    <Label className="text-base font-medium">MOQ Price Tiers</Label>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Set different prices based on order quantity
                                                    </p>
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="moqTier1">Tier 1 Qty (units)</Label>
                                                                <Input
                                                                    id="moqTier1"
                                                                    type="number"
                                                                    value={quotationForm.moqTier1}
                                                                    onChange={(e) => updateForm("moqTier1", e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="moqTier1Price">Price per unit (฿)</Label>
                                                                <Input
                                                                    id="moqTier1Price"
                                                                    type="number"
                                                                    placeholder="e.g., 120"
                                                                    value={quotationForm.moqTier1Price}
                                                                    onChange={(e) => updateForm("moqTier1Price", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="moqTier2">Tier 2 Qty (units)</Label>
                                                                <Input
                                                                    id="moqTier2"
                                                                    type="number"
                                                                    value={quotationForm.moqTier2}
                                                                    onChange={(e) => updateForm("moqTier2", e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="moqTier2Price">Price per unit (฿)</Label>
                                                                <Input
                                                                    id="moqTier2Price"
                                                                    type="number"
                                                                    placeholder="e.g., 100"
                                                                    value={quotationForm.moqTier2Price}
                                                                    onChange={(e) => updateForm("moqTier2Price", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="moqTier3">Tier 3 Qty (units)</Label>
                                                                <Input
                                                                    id="moqTier3"
                                                                    type="number"
                                                                    value={quotationForm.moqTier3}
                                                                    onChange={(e) => updateForm("moqTier3", e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="moqTier3Price">Price per unit (฿)</Label>
                                                                <Input
                                                                    id="moqTier3Price"
                                                                    type="number"
                                                                    placeholder="e.g., 85"
                                                                    value={quotationForm.moqTier3Price}
                                                                    onChange={(e) => updateForm("moqTier3Price", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 4: Terms */}
                                        {wizardStep === 4 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    <FileCheck className="h-5 w-5 text-primary" />
                                                    Step 4: Payment & Delivery Terms
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="paymentTerms">Payment Terms *</Label>
                                                        <Select
                                                            value={quotationForm.paymentTerms}
                                                            onValueChange={(v) => updateForm("paymentTerms", v)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select payment terms" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="30-40-30">30% Deposit, 40% Production, 30% Delivery</SelectItem>
                                                                <SelectItem value="50-50">50% Deposit, 50% Delivery</SelectItem>
                                                                <SelectItem value="100-upfront">100% Upfront</SelectItem>
                                                                <SelectItem value="net30">Net 30 Days</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="leadTime">Lead Time *</Label>
                                                        <Select
                                                            value={quotationForm.leadTime}
                                                            onValueChange={(v) => updateForm("leadTime", v)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select lead time" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="2-weeks">2 Weeks</SelectItem>
                                                                <SelectItem value="4-weeks">4 Weeks</SelectItem>
                                                                <SelectItem value="6-weeks">6 Weeks</SelectItem>
                                                                <SelectItem value="8-weeks">8 Weeks</SelectItem>
                                                                <SelectItem value="custom">Custom</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="validityPeriod">Quotation Validity (days)</Label>
                                                    <Input
                                                        id="validityPeriod"
                                                        type="number"
                                                        value={quotationForm.validityPeriod}
                                                        onChange={(e) => updateForm("validityPeriod", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="notes">Additional Notes</Label>
                                                    <Textarea
                                                        id="notes"
                                                        placeholder="Any additional terms, conditions, or notes..."
                                                        value={quotationForm.notes}
                                                        onChange={(e) => updateForm("notes", e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Navigation Buttons */}
                                        <div className="flex items-center justify-between pt-6 border-t">
                                            <Button
                                                variant="outline"
                                                onClick={handlePrevStep}
                                                disabled={wizardStep === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </Button>

                                            {wizardStep < 4 ? (
                                                <Button onClick={handleNextStep}>
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            ) : (
                                                <Button onClick={handleGenerateQuotation} disabled={generating}>
                                                    {generating ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Generate Quotation PDF
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Footer />
        </div>
    );
}
