"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Package, Eye, TrendingUp, MessageSquare, FileText, Download,
    Clock, CheckCircle2, Loader2, Plus, ChevronRight, ChevronLeft,
    Upload, User, Box, DollarSign, FileCheck, Edit, BarChart3, Lock,
    Megaphone, Zap, Crown, Star, ImageIcon, Video, BadgeCheck, ExternalLink
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
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

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

const revenueData = [
    { month: "Oct", revenue: 650000 }, { month: "Nov", revenue: 820000 },
    { month: "Dec", revenue: 910000 }, { month: "Jan", revenue: 1050000 },
    { month: "Feb", revenue: 1180000 }, { month: "Mar", revenue: 1200000 },
];
const orderTrendData = [
    { month: "Oct", orders: 12 }, { month: "Nov", orders: 15 },
    { month: "Dec", orders: 18 }, { month: "Jan", orders: 20 },
    { month: "Feb", orders: 22 }, { month: "Mar", orders: 23 },
];
const categoryData = [
    { name: "Skincare", value: 45 }, { name: "Cosmetics", value: 30 },
    { name: "Supplements", value: 15 }, { name: "Other", value: 10 },
];
const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

// Mock past quotations
const pastQuotations = [
    { id: "QT-001", customer: "Beauty Brand Co.", product: "Serum 30ml", date: "Feb 20, 2026", amount: "฿180,000", status: "sent" },
    { id: "QT-002", customer: "Glow Skincare", product: "Toner 100ml", date: "Feb 15, 2026", amount: "฿90,000", status: "accepted" },
    { id: "QT-003", customer: "Thai Wellness Ltd.", product: "Cream 50g", date: "Feb 10, 2026", amount: "฿225,000", status: "expired" },
];

// Mock trend data for blur section
const trendInsights = [
    { title: "Top Growing Category", value: "Anti-Aging Serums", change: "+42%" },
    { title: "Avg. Order Size", value: "฿185,000", change: "+15%" },
    { title: "Market Demand Index", value: "High", change: "↑" },
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

const getQuotationStatusBadge = (status: string) => {
    switch (status) {
        case "sent":
            return <Badge variant="outline" className="text-primary border-primary">Sent</Badge>;
        case "accepted":
            return <Badge variant="outline" className="text-success border-success">Accepted</Badge>;
        case "expired":
            return <Badge variant="outline" className="text-muted-foreground border-muted">Expired</Badge>;
        default:
            return null;
    }
};

interface QuotationFormData {
    customerName: string; customerEmail: string; customerPhone: string; companyName: string;
    productCategory: string; productName: string; productDescription: string; referenceImage: string; ingredients: string;
    materialCost: string; laborCost: string; profitMargin: string;
    moqTier1: string; moqTier1Price: string; moqTier2: string; moqTier2Price: string; moqTier3: string; moqTier3Price: string;
    paymentTerms: string; leadTime: string; validityPeriod: string; notes: string;
}

const initialFormData: QuotationFormData = {
    customerName: "", customerEmail: "", customerPhone: "", companyName: "",
    productCategory: "", productName: "", productDescription: "", referenceImage: "", ingredients: "",
    materialCost: "", laborCost: "", profitMargin: "",
    moqTier1: "500", moqTier1Price: "", moqTier2: "1000", moqTier2Price: "", moqTier3: "5000", moqTier3Price: "",
    paymentTerms: "", leadTime: "", validityPeriod: "30", notes: "",
};

// Profile management
const profileData = {
    about: "Leading OEM manufacturer specializing in skincare and cosmetics. GMP certified facility with 15+ years of experience.",
    tags: ["Skincare", "Cosmetics", "GMP", "ISO 9001"],
    certifications: ["GMP", "ISO 9001:2015", "Halal"],
    machinery: ["Emulsifier 500L", "Filling Machine", "Labeling Machine", "Packaging Line"],
    products: [
        { name: "Sunscreen SPF50", category: "Skincare", moq: "500 pcs" },
        { name: "Anti-Aging Serum", category: "Skincare", moq: "300 pcs" },
        { name: "Whitening Cream", category: "Cosmetics", moq: "1000 pcs" },
    ],
};

// Verification tasks for badge
const verificationTasks = [
    { id: "kyb", label: "KYB Director Verification", completed: false },
    { id: "license", label: "Factory License (ร.ง.4)", completed: false },
    { id: "fda", label: "FDA License (อย.)", completed: false },
];

const OEMDashboard = () => {
    const [showQuotationWizard, setShowQuotationWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [quotationForm, setQuotationForm] = useState<QuotationFormData>(initialFormData);
    const [generating, setGenerating] = useState(false);
    const [quotationGenerated, setQuotationGenerated] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileAbout, setProfileAbout] = useState(profileData.about);

    const updateForm = (field: keyof QuotationFormData, value: string) => {
        setQuotationForm(prev => ({ ...prev, [field]: value }));
    };

    const handleNextStep = () => { if (wizardStep < 4) setWizardStep(wizardStep + 1); };
    const handlePrevStep = () => { if (wizardStep > 1) setWizardStep(wizardStep - 1); };

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
        setShowQuotationWizard(false);
    };

    const handleExportCSV = () => {
        const csv = "Order ID,Customer,Product,Quantity,Status,Amount\n" +
            orders.map(o => `${o.id},${o.customer},${o.product},${o.quantity},${o.status},${o.amount}`).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "orders.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    const completedVerifications = verificationTasks.filter(t => t.completed).length;
    const verificationProgress = (completedVerifications / verificationTasks.length) * 100;

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
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingProfile(!editingProfile)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                        <Link href="/factory/skincare-plus">
                            <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Preview Profile
                            </Button>
                        </Link>
                        <Link href="/pricing">
                            <Button variant="outline" size="sm">Upgrade Plan</Button>
                        </Link>
                    </div>
                </div>

                {/* Verification Badge Progress */}
                <Card className="mb-6 border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BadgeCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Verified Badge Progress</p>
                                    <p className="text-xs text-muted-foreground">{completedVerifications}/{verificationTasks.length} tasks completed — Complete all to earn your badge</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 min-w-[200px]">
                                <Progress value={verificationProgress} className="h-2 flex-1" />
                                <span className="text-sm font-medium text-foreground">{Math.round(verificationProgress)}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="quotation">AI Quotation</TabsTrigger>
                        <TabsTrigger value="ads">Ads & Boost</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="trends">Market Trends</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Executive Summary
                            </Button>
                        </div>
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        Recent Chats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {recentChats.map((chat) => (
                                        <div key={chat.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary">{chat.name.charAt(0)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-foreground truncate">{chat.name}</p>
                                                    {chat.unread && <span className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        Active Orders
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {orders.slice(0, 3).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
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

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Factory Profile</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setEditingProfile(!editingProfile)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        {editingProfile ? "Save Changes" : "Edit Profile"}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Profile Picture */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    {editingProfile && (
                                        <Button variant="outline" size="sm">
                                            <Upload className="h-4 w-4 mr-2" />
                                            Change Photo
                                        </Button>
                                    )}
                                </div>

                                {/* About */}
                                <div className="space-y-2">
                                    <Label>About</Label>
                                    {editingProfile ? (
                                        <Textarea value={profileAbout} onChange={(e) => setProfileAbout(e.target.value)} rows={3} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">{profileAbout}</p>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Showcase Products */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Showcase Products</Label>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <ImageIcon className="h-3 w-3" />
                                            <span>Free: 5 photos max</span>
                                            <Video className="h-3 w-3 ml-2 text-muted" />
                                            <span className="text-muted">Video: Pro only</span>
                                        </div>
                                    </div>
                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {profileData.products.map((p) => (
                                            <div key={p.name} className="p-3 border rounded-lg bg-secondary/30">
                                                <p className="font-medium text-foreground text-sm">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.category} • MOQ {p.moq}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Machinery */}
                                <div className="space-y-2">
                                    <Label>Machinery List</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.machinery.map((m) => (
                                            <Badge key={m} variant="outline">{m}</Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Certifications */}
                                <div className="space-y-2">
                                    <Label>Certifications</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.certifications.map((c) => (
                                            <Badge key={c} className="bg-success/10 text-success border-success/30">{c}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Order Management</CardTitle>
                                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
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
                                                    <p><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">{order.amount}</span></p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
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

                    {/* Analytics Tab with Blur */}
                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Advanced Analytics
                                </CardTitle>
                                <CardDescription>Unlock detailed insights with a Pro subscription</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <div className="blur-sm pointer-events-none select-none space-y-8">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-sm font-medium text-foreground mb-4">Monthly Revenue</h4>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <BarChart data={revenueData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-foreground mb-4">Order Trend</h4>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <LineChart data={orderTrendData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="max-w-xs mx-auto">
                                            <h4 className="text-sm font-medium text-foreground mb-4 text-center">Category Breakdown</h4>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                                        {categoryData.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center space-y-4 bg-background/80 backdrop-blur-sm p-8 rounded-xl border shadow-lg">
                                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                                <Lock className="h-7 w-7 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">Unlock Advanced Analytics</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs">
                                                Upgrade to Pro to access revenue trends, order analytics, and category insights.
                                            </p>
                                            <Link href="/pricing">
                                                <Button className="mt-2">
                                                    <TrendingUp className="h-4 w-4 mr-2" />
                                                    Upgrade to Pro
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ads & Boost Tab */}
                    <TabsContent value="ads" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Ad Performance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Megaphone className="h-5 w-5 text-primary" />
                                        Ad Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                                            <p className="text-xl font-bold text-foreground">234</p>
                                            <p className="text-xs text-muted-foreground">Impressions</p>
                                        </div>
                                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                                            <p className="text-xl font-bold text-foreground">18</p>
                                            <p className="text-xs text-muted-foreground">Clicks</p>
                                        </div>
                                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                                            <p className="text-xl font-bold text-foreground">7.6%</p>
                                            <p className="text-xs text-muted-foreground">CTR</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">No active ad campaigns. Start a boost to increase visibility.</p>
                                </CardContent>
                            </Card>

                            {/* Ad Packages */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Ad Packages
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 text-primary" />
                                                <span className="font-medium text-foreground">Pro: Search Boost</span>
                                            </div>
                                            <Badge variant="secondary">1 Free/month</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">General rank boosting in search results for 7 days</p>
                                        <Button size="sm" className="w-full">Activate Search Boost</Button>
                                    </div>
                                    <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Crown className="h-4 w-4 text-warning" />
                                                <span className="font-medium text-foreground">Premium: Top Ranking</span>
                                            </div>
                                            <Badge className="bg-warning/10 text-warning border-warning/30">฿2,500/mo</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">Guaranteed top search ranking with featured badge</p>
                                        <Button size="sm" variant="outline" className="w-full">
                                            <Crown className="h-4 w-4 mr-2" />
                                            Upgrade to Premium
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Market Trends Tab (Blurred for free users) */}
                    <TabsContent value="trends">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Deep Market Trend Reports
                                </CardTitle>
                                <CardDescription>Industry insights and demand forecasting</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <div className="blur-sm pointer-events-none select-none space-y-6">
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            {trendInsights.map((insight) => (
                                                <div key={insight.title} className="p-4 bg-secondary/50 rounded-lg">
                                                    <p className="text-xs text-muted-foreground">{insight.title}</p>
                                                    <p className="text-lg font-bold text-foreground">{insight.value}</p>
                                                    <p className="text-sm text-success">{insight.change}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <LineChart data={revenueData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center space-y-4 bg-background/80 backdrop-blur-sm p-8 rounded-xl border shadow-lg">
                                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                                <Lock className="h-7 w-7 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">Unlock Market Trends</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs">
                                                Subscribe to access real-time market insights, demand forecasting, and competitor analysis.
                                            </p>
                                            <Link href="/pricing">
                                                <Button className="mt-2">
                                                    <TrendingUp className="h-4 w-4 mr-2" />
                                                    Subscribe Now
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Quotation Tab */}
                    <TabsContent value="quotation">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            AI Quotation Generator
                                        </CardTitle>
                                        <CardDescription>
                                            {showQuotationWizard ? "Create professional PDF quotations in 4 easy steps" : "Manage and create quotations"}
                                        </CardDescription>
                                    </div>
                                    {!showQuotationWizard && !quotationGenerated && (
                                        <Button onClick={() => setShowQuotationWizard(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Past Quotations List (default view) */}
                                {!showQuotationWizard && !quotationGenerated && (
                                    <div className="space-y-3">
                                        {pastQuotations.map((q) => (
                                            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-secondary/30 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-foreground">{q.id}</span>
                                                        {getQuotationStatusBadge(q.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{q.customer} — {q.product}</p>
                                                    <p className="text-xs text-muted-foreground">{q.date}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-foreground">{q.amount}</span>
                                                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Generated Result */}
                                {quotationGenerated && (
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
                                                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Download</Button>
                                                <Button size="sm">Send to Chat</Button>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="w-full" onClick={handleResetWizard}>
                                            <Plus className="h-4 w-4 mr-2" />Create New Quotation
                                        </Button>
                                    </div>
                                )}

                                {/* Wizard */}
                                {showQuotationWizard && !quotationGenerated && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-8">
                                            {wizardSteps.map((step, index) => (
                                                <div key={step.number} className="flex items-center flex-1 last:flex-none">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wizardStep === step.number ? "bg-primary text-primary-foreground"
                                                            : wizardStep > step.number ? "bg-success text-success-foreground"
                                                                : "bg-muted text-muted-foreground"
                                                            }`}>
                                                            {wizardStep > step.number ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                                        </div>
                                                        <span className={`text-xs mt-2 hidden sm:block ${wizardStep === step.number ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                                            {step.title}
                                                        </span>
                                                    </div>
                                                    {index < wizardSteps.length - 1 && (
                                                        <div className={`flex-1 h-0.5 mx-3 ${wizardStep > step.number ? "bg-primary" : "bg-muted"}`} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {wizardStep === 1 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2"><User className="h-5 w-5 text-primary" />Step 1: Customer Information</h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2"><Label>Customer Name <span className="text-destructive">*</span></Label><Input placeholder="John Doe" value={quotationForm.customerName} onChange={(e) => updateForm("customerName", e.target.value)} /></div>
                                                    <div className="space-y-2"><Label>Company Name</Label><Input placeholder="Beauty Brand Co." value={quotationForm.companyName} onChange={(e) => updateForm("companyName", e.target.value)} /></div>
                                                    <div className="space-y-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" placeholder="john@example.com" value={quotationForm.customerEmail} onChange={(e) => updateForm("customerEmail", e.target.value)} /></div>
                                                    <div className="space-y-2"><Label>Phone</Label><Input placeholder="08X-XXX-XXXX" value={quotationForm.customerPhone} onChange={(e) => updateForm("customerPhone", e.target.value)} /></div>
                                                </div>
                                            </div>
                                        )}

                                        {wizardStep === 2 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2"><Box className="h-5 w-5 text-primary" />Step 2: Product Specifications</h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Product Category <span className="text-destructive">*</span></Label>
                                                        <Select value={quotationForm.productCategory} onValueChange={(v) => updateForm("productCategory", v)}>
                                                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="skincare">Skincare</SelectItem>
                                                                <SelectItem value="cosmetics">Cosmetics</SelectItem>
                                                                <SelectItem value="supplements">Supplements</SelectItem>
                                                                <SelectItem value="haircare">Hair Care</SelectItem>
                                                                <SelectItem value="bodycare">Body Care</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2"><Label>Product Name <span className="text-destructive">*</span></Label><Input placeholder="e.g., Sunscreen SPF50" value={quotationForm.productName} onChange={(e) => updateForm("productName", e.target.value)} /></div>
                                                </div>
                                                <div className="space-y-2"><Label>Product Description</Label><Textarea placeholder="Describe the product specifications..." value={quotationForm.productDescription} onChange={(e) => updateForm("productDescription", e.target.value)} rows={3} /></div>
                                                <div className="space-y-2"><Label>Key Ingredients / Materials</Label><Textarea placeholder="List main ingredients" value={quotationForm.ingredients} onChange={(e) => updateForm("ingredients", e.target.value)} rows={2} /></div>
                                            </div>
                                        )}

                                        {wizardStep === 3 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Step 3: Costing & MOQ Tiers</h3>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="space-y-2"><Label>Material Cost (฿/unit)</Label><Input type="number" placeholder="50" value={quotationForm.materialCost} onChange={(e) => updateForm("materialCost", e.target.value)} /></div>
                                                    <div className="space-y-2"><Label>Labor Cost (฿/unit)</Label><Input type="number" placeholder="20" value={quotationForm.laborCost} onChange={(e) => updateForm("laborCost", e.target.value)} /></div>
                                                    <div className="space-y-2"><Label>Profit Margin (%)</Label><Input type="number" placeholder="30" value={quotationForm.profitMargin} onChange={(e) => updateForm("profitMargin", e.target.value)} /></div>
                                                </div>
                                                <div className="mt-6">
                                                    <Label className="text-base font-medium">MOQ Price Tiers</Label>
                                                    <div className="space-y-3 mt-3">
                                                        {[
                                                            { qty: "moqTier1" as const, price: "moqTier1Price" as const },
                                                            { qty: "moqTier2" as const, price: "moqTier2Price" as const },
                                                            { qty: "moqTier3" as const, price: "moqTier3Price" as const },
                                                        ].map((tier, i) => (
                                                            <div key={i} className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2"><Label>Tier {i + 1} Qty</Label><Input type="number" value={quotationForm[tier.qty]} onChange={(e) => updateForm(tier.qty, e.target.value)} /></div>
                                                                <div className="space-y-2"><Label>Price/unit (฿)</Label><Input type="number" placeholder={`e.g., ${120 - i * 20}`} value={quotationForm[tier.price]} onChange={(e) => updateForm(tier.price, e.target.value)} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {wizardStep === 4 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-foreground flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" />Step 4: Payment & Delivery Terms</h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Payment Terms <span className="text-destructive">*</span></Label>
                                                        <Select value={quotationForm.paymentTerms} onValueChange={(v) => updateForm("paymentTerms", v)}>
                                                            <SelectTrigger><SelectValue placeholder="Select payment terms" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="30-40-30">30% Deposit, 40% Production, 30% Delivery</SelectItem>
                                                                <SelectItem value="50-50">50% Deposit, 50% Delivery</SelectItem>
                                                                <SelectItem value="100-upfront">100% Upfront</SelectItem>
                                                                <SelectItem value="net30">Net 30 Days</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Lead Time <span className="text-destructive">*</span></Label>
                                                        <Select value={quotationForm.leadTime} onValueChange={(v) => updateForm("leadTime", v)}>
                                                            <SelectTrigger><SelectValue placeholder="Select lead time" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="2-weeks">2 Weeks</SelectItem>
                                                                <SelectItem value="4-weeks">4 Weeks</SelectItem>
                                                                <SelectItem value="6-weeks">6 Weeks</SelectItem>
                                                                <SelectItem value="8-weeks">8 Weeks</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2"><Label>Quotation Validity (days)</Label><Input type="number" value={quotationForm.validityPeriod} onChange={(e) => updateForm("validityPeriod", e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Additional Notes</Label><Textarea placeholder="Any additional terms..." value={quotationForm.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={3} /></div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-6 border-t">
                                            <Button variant="outline" onClick={() => { if (wizardStep === 1) setShowQuotationWizard(false); else handlePrevStep(); }}>
                                                <ChevronLeft className="h-4 w-4 mr-1" />{wizardStep === 1 ? "Cancel" : "Previous"}
                                            </Button>
                                            {wizardStep < 4 ? (
                                                <Button onClick={handleNextStep}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
                                            ) : (
                                                <Button onClick={handleGenerateQuotation} disabled={generating}>
                                                    {generating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>) : (<><FileText className="h-4 w-4 mr-2" />Generate Quotation PDF</>)}
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
};

export default OEMDashboard;
