"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Building2, FileCheck, Palette, Shield, Award, Lightbulb, Check, ChevronRight,
    Rocket, Send, Briefcase, Megaphone, Calculator, Scale, Code, Truck, PartyPopper,
    Users, Star, ExternalLink, Gavel, ArrowRight, BookOpen, Download, ExternalLinkIcon,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define interfaces for data structures
interface LaunchpadItem {
    id: string; title: string; titleTh: string; description: string; icon: typeof Building2;
    phase: number; category: "all" | "cosmetics" | "supplements";
    partnerName?: string; partnerPrice?: string; whyNeeded?: string[];
}
interface Agency {
    id: string; name: string; category: string; rating: number; reviews: number;
    startingPrice: string; description: string; portfolio: string[]; tags: string[];
}

const launchpadItems: LaunchpadItem[] = [
    { id: "company-registration", title: "Register Company (DBD)", titleTh: "จดทะเบียนบริษัท", description: "Establish your legal business entity with the Department of Business Development", icon: Building2, phase: 1, category: "all", partnerName: "DBD Fast Track Partner", partnerPrice: "฿ 8,500", whyNeeded: ["Required for FDA registration", "Enables business tax benefits", "Builds customer trust", "Required for B2B contracts"] },
    { id: "logo-design", title: "Logo & Brand Design", titleTh: "ออกแบบโลโก้และแบรนด์", description: "Create professional branding assets for your product line", icon: Palette, phase: 1, category: "all", partnerName: "Creative Design Studio", partnerPrice: "฿ 5,900", whyNeeded: ["First impression matters", "Required for trademark registration", "Professional packaging design", "Marketing materials ready"] },
    { id: "trademark", title: "Trademark Registration (IP)", titleTh: "จดเครื่องหมายการค้า", description: "Protect your brand name and logo with intellectual property registration", icon: Shield, phase: 2, category: "all", partnerName: "IP Thailand Services", partnerPrice: "฿ 12,500", whyNeeded: ["Prevent brand copying", "Legal ownership proof", "Required for marketplace listing", "Long-term brand value"] },
    { id: "fda-cosmetics", title: "FDA Notification (Jor-Or)", titleTh: "แจ้ง จ.อ. เครื่องสำอาง", description: "Register your cosmetic product with Thai FDA for legal sale", icon: FileCheck, phase: 2, category: "cosmetics", partnerName: "FDA Consultant Pro", partnerPrice: "฿ 3,500 / SKU", whyNeeded: ["Legally required for cosmetics", "Required for e-commerce platforms", "Build consumer trust", "Avoid legal penalties"] },
    { id: "fda-supplements", title: "FDA License (Sor-Bor)", titleTh: "ขอ อ.ย. อาหารเสริม", description: "Obtain FDA license for supplement products - more stringent requirements", icon: FileCheck, phase: 2, category: "supplements", partnerName: "Supplement FDA Expert", partnerPrice: "฿ 25,000 / SKU", whyNeeded: ["Mandatory for supplement sale", "Includes lab testing", "GMP factory verification", "Claim approval process"] },
    { id: "patent", title: "Patent Application (Optional)", titleTh: "จดสิทธิบัตร (ตัวเลือก)", description: "Protect unique formulations or innovations with patent registration", icon: Lightbulb, phase: 3, category: "all", partnerName: "Patent Thailand", partnerPrice: "฿ 45,000+", whyNeeded: ["Protect unique innovations", "Competitive advantage", "Licensing opportunities", "Investment attraction"] },
];

const agencies: Agency[] = [
    { id: "bc-1", name: "SME Strategy Partners", category: "Business Consultant", rating: 4.9, reviews: 127, startingPrice: "฿15,000", description: "Strategic planning and business model development for SMEs and startups", portfolio: ["Brand expansion", "Market entry", "Investor pitch"], tags: ["Strategy", "Planning", "Growth"] },
    { id: "mk-1", name: "Digital Wave Agency", category: "Marketing Agency", rating: 4.8, reviews: 89, startingPrice: "฿25,000/mo", description: "Full-service digital marketing including social media, ads, and content", portfolio: ["Social Media", "Facebook Ads", "Content Creation"], tags: ["Digital", "Social", "Ads"] },
    { id: "mk-2", name: "BrandCraft Studio", category: "Marketing Agency", rating: 4.7, reviews: 64, startingPrice: "฿8,000", description: "Brand identity, packaging design, and visual marketing materials", portfolio: ["Branding", "Packaging", "Photography"], tags: ["Branding", "Design", "Visual"] },
    { id: "ac-1", name: "TaxPro Accounting", category: "Accounting & Audit", rating: 4.9, reviews: 156, startingPrice: "฿3,500/mo", description: "Company registration, monthly bookkeeping, and tax filing services", portfolio: ["Company Reg", "Bookkeeping", "Tax Filing"], tags: ["Tax", "Accounting", "Registration"] },
    { id: "lg-1", name: "LegalThai Associates", category: "Legal Firm", rating: 4.8, reviews: 78, startingPrice: "฿5,000", description: "FDA registration, trademark filing, and contract drafting services", portfolio: ["FDA", "Trademark", "Contracts"], tags: ["FDA", "IP", "Contracts"] },
    { id: "sw-1", name: "CodeCraft Solutions", category: "Software House", rating: 4.6, reviews: 43, startingPrice: "฿50,000", description: "E-commerce websites, mobile apps, and CRM development", portfolio: ["E-commerce", "Mobile App", "CRM"], tags: ["Web", "App", "E-commerce"] },
    { id: "lo-1", name: "SwiftShip Logistics", category: "Logistics", rating: 4.7, reviews: 112, startingPrice: "฿15/order", description: "Warehousing, fulfillment, and nationwide shipping solutions", portfolio: ["Fulfillment", "Warehouse", "COD"], tags: ["Shipping", "Warehouse", "Fulfillment"] },
    { id: "ev-1", name: "LaunchPad Events", category: "Event & Venue", rating: 4.5, reviews: 31, startingPrice: "฿35,000", description: "Product launch events, pop-up stores, and brand activations", portfolio: ["Launch Events", "Pop-ups", "Exhibitions"], tags: ["Events", "Launch", "Activation"] },
    { id: "in-1", name: "InfluenceThai", category: "Influencer Agency", rating: 4.6, reviews: 67, startingPrice: "฿10,000", description: "KOL matching, influencer campaigns, and UGC content creation", portfolio: ["KOL", "TikTok", "Instagram"], tags: ["Influencer", "KOL", "UGC"] },
];

const agencyCategories = [
    { id: "all", label: "All", icon: Briefcase },
    { id: "Business Consultant", label: "Consultant", icon: Briefcase },
    { id: "Marketing Agency", label: "Marketing", icon: Megaphone },
    { id: "Accounting & Audit", label: "Accounting", icon: Calculator },
    { id: "Legal Firm", label: "Legal", icon: Scale },
    { id: "Software House", label: "Software", icon: Code },
    { id: "Logistics", label: "Logistics", icon: Truck },
    { id: "Event & Venue", label: "Events", icon: PartyPopper },
    { id: "Influencer Agency", label: "Influencer", icon: Users },
];

const progressSteps = [
    { id: 1, label: "Idea", icon: Lightbulb },
    { id: 2, label: "Matching", icon: Users },
    { id: 3, label: "Quotation", icon: FileCheck },
    { id: 4, label: "Contract", icon: Shield },
    { id: 5, label: "Launchpad", icon: Rocket },
    { id: 6, label: "Go to Market", icon: PartyPopper },
];

const knowledgeBaseItems = [
    {
        title: "สิ่งที่ต้องคำนึงถึงก่อนเริ่มธุรกิจ",
        titleEn: "Key Considerations Before Starting",
        items: [
            "Choose the right business structure (sole proprietor vs company)",
            "Understand your product's regulatory requirements",
            "Plan your budget including hidden costs (FDA, trademark, packaging)",
            "Research your target market and competition",
        ],
    },
    {
        title: "แบบฟอร์ม/เทมเพลตที่จำเป็น",
        titleEn: "Essential Templates & Forms",
        templates: [
            { name: "Manufacturing Agreement Template", type: "PDF" },
            { name: "MOQ Request Form", type: "DOC" },
            { name: "Product Specification Sheet", type: "XLSX" },
            { name: "Brand Guidelines Template", type: "PDF" },
        ],
    },
    {
        title: "แหล่งข้อมูลอ้างอิง",
        titleEn: "External Resources",
        links: [
            { name: "กรมพัฒนาธุรกิจการค้า (DBD)", url: "https://www.dbd.go.th" },
            { name: "สำนักงานคณะกรรมการอาหารและยา (อย.)", url: "https://www.fda.moph.go.th" },
            { name: "กรมทรัพย์สินทางปัญญา (DIP)", url: "https://www.ipthailand.go.th" },
            { name: "กรมสรรพากร (Revenue Department)", url: "https://www.rd.go.th" },
        ],
    },
];

const BrandLaunchpad = () => {
    const [category, setCategory] = useState<"all" | "cosmetics" | "supplements">("all");
    const [completedItems, setCompletedItems] = useState<string[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<LaunchpadItem | null>(null);
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
    const [showLawyerModal, setShowLawyerModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
    const [agencyCategory, setAgencyCategory] = useState("all");

    const filteredItems = launchpadItems.filter((item) => item.category === "all" || item.category === category);
    const filteredAgencies = agencyCategory === "all" ? agencies : agencies.filter(a => a.category === agencyCategory);

    const phases = [
        { number: 1, title: "Foundation", titleTh: "รากฐาน" },
        { number: 2, title: "Compliance", titleTh: "การปฏิบัติตามกฎหมาย" },
        { number: 3, title: "Growth", titleTh: "เติบโต" },
    ];

    const progress = Math.round((completedItems.length / filteredItems.length) * 100);
    const currentActiveStep = 4;

    const toggleComplete = (id: string) => {
        setCompletedItems((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
    };

    const handleSubmitLead = () => {
        console.log("Lead submitted:", { partner: selectedPartner?.partnerName || selectedAgency?.name, ...formData });
        setSelectedPartner(null);
        setSelectedAgency(null);
        setShowLawyerModal(false);
        setFormData({ name: "", phone: "", email: "" });
    };

    const legalThaiAgency = agencies.find(a => a.id === "lg-1")!;

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            {/* Hero Section – thematic rocket/roadmap illustration */}
            <section className="relative py-12 md:py-16 overflow-hidden">
                {/* Thematic background with rocket/pathway illustration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cpath d='M200 50 L200 350' stroke='%23f97316' stroke-width='2' stroke-dasharray='8 8' fill='none'/%3E%3Ccircle cx='200' cy='80' r='20' fill='none' stroke='%23f97316' stroke-width='2'/%3E%3Ccircle cx='200' cy='160' r='15' fill='none' stroke='%23f97316' stroke-width='2'/%3E%3Ccircle cx='200' cy='240' r='15' fill='none' stroke='%23f97316' stroke-width='2'/%3E%3Ccircle cx='200' cy='320' r='20' fill='none' stroke='%23f97316' stroke-width='2'/%3E%3Cpolygon points='200,30 210,55 190,55' fill='%23f97316' opacity='0.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                }} />
                {/* Decorative circles */}
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />

                <div className="container relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Rocket className="h-5 w-5 text-primary" />
                            </div>
                            <Badge variant="secondary">Brand Launchpad</Badge>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Your Brand Roadmap</h1>
                        <p className="text-muted-foreground text-lg mb-8">
                            Complete these steps while your products are being manufactured. Build a compliant, protected brand from day one.
                        </p>
                        <div className="bg-card border rounded-xl p-6 max-w-md mx-auto">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                                <span className="text-sm font-bold text-primary">{progress}% Ready</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                            <p className="text-xs text-muted-foreground mt-2">{completedItems.length} of {filteredItems.length} tasks completed</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Progress Pathway */}
            <section className="border-b bg-card">
                <div className="container py-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-6 gap-0">
                            {progressSteps.map((step, index) => {
                                const isCompleted = step.id < currentActiveStep;
                                const isCurrent = step.id === currentActiveStep;
                                return (
                                    <div key={step.id} className="relative flex flex-col items-center">
                                        {index > 0 && (
                                            <div className={`absolute top-5 -left-1/2 w-full h-0.5 ${isCompleted ? "bg-success" : isCurrent ? "bg-primary/50" : "bg-border"}`} />
                                        )}
                                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? "bg-success text-success-foreground shadow-sm"
                                            : isCurrent ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20"
                                                : "bg-muted text-muted-foreground"
                                            }`}>
                                            {isCompleted ? <Check className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                                        </div>
                                        <span className={`text-xs mt-2 text-center leading-tight ${isCompleted || isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                                            }`}>{step.label}</span>
                                        {isCurrent && <span className="text-[10px] text-primary font-medium mt-0.5">Current</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Tabs */}
            <section className="py-8 flex-1">
                <div className="container">
                    <Tabs defaultValue="checklist" className="space-y-6">
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="checklist">Compliance Checklist</TabsTrigger>
                            <TabsTrigger value="marketplace">Agency Marketplace</TabsTrigger>
                            <TabsTrigger value="knowledge">
                                <BookOpen className="h-4 w-4 mr-1" /> Knowledge Base
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="checklist" className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-background rounded-lg border">
                                <span className="text-sm font-medium text-foreground">Product Category:</span>
                                <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">General Products</SelectItem>
                                        <SelectItem value="cosmetics">Cosmetics (เครื่องสำอาง)</SelectItem>
                                        <SelectItem value="supplements">Supplements (อาหารเสริม)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Card className="border-primary/30 bg-primary/5">
                                <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Gavel className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="font-semibold text-foreground">Need Professional Legal Help?</h3>
                                        <p className="text-sm text-muted-foreground">Get expert guidance on contracts, FDA, and compliance.</p>
                                    </div>
                                    <Button onClick={() => setShowLawyerModal(true)}>
                                        <Gavel className="h-4 w-4 mr-2" /> Contact a Lawyer
                                    </Button>
                                </CardContent>
                            </Card>

                            <div className="space-y-12">
                                {phases.map((phase) => {
                                    const phaseItems = filteredItems.filter((item) => item.phase === phase.number);
                                    if (phaseItems.length === 0) return null;
                                    return (
                                        <div key={phase.number}>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{phase.number}</div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-foreground">Phase {phase.number}: {phase.title}</h2>
                                                    <p className="text-sm text-muted-foreground">{phase.titleTh}</p>
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-0 md:ml-14">
                                                {phaseItems.map((item) => {
                                                    const isCompleted = completedItems.includes(item.id);
                                                    return (
                                                        <Card key={item.id} className={`transition-all ${isCompleted ? "opacity-60 bg-muted/50" : "hover:shadow-md"}`}>
                                                            <CardHeader className="pb-3">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? "bg-success/20" : "bg-primary/10"}`}>
                                                                            {isCompleted ? <Check className="h-5 w-5 text-success" /> : <item.icon className="h-5 w-5 text-primary" />}
                                                                        </div>
                                                                        <div>
                                                                            <CardTitle className="text-base">{item.title}</CardTitle>
                                                                            <p className="text-xs text-muted-foreground">{item.titleTh}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Checkbox checked={isCompleted} onCheckedChange={() => toggleComplete(item.id)} />
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                                                                {!isCompleted && item.partnerName && (
                                                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedPartner(item)}>
                                                                        Hire Expert<ChevronRight className="h-4 w-4 ml-1" />
                                                                    </Button>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </TabsContent>

                        <TabsContent value="marketplace" className="space-y-6">
                            <div className="flex flex-wrap gap-2">
                                {agencyCategories.map((cat) => (
                                    <Button key={cat.id} variant={agencyCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setAgencyCategory(cat.id)} className="gap-2">
                                        <cat.icon className="h-4 w-4" />{cat.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredAgencies.map((agency) => (
                                    <Card key={agency.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Badge variant="secondary" className="mb-2">{agency.category}</Badge>
                                                    <CardTitle className="text-base">{agency.name}</CardTitle>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Star className="h-4 w-4 fill-warning text-warning" />
                                                    <span className="font-medium">{agency.rating}</span>
                                                    <span className="text-muted-foreground">({agency.reviews})</span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground">{agency.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {agency.tags.map((tag) => (<Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>))}
                                            </div>
                                            <div className="flex gap-2">
                                                {agency.portfolio.map((item) => (<span key={item} className="text-xs bg-secondary/50 px-2 py-1 rounded">{item}</span>))}
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Starting from</p>
                                                    <p className="font-semibold text-foreground">{agency.startingPrice}</p>
                                                </div>
                                                <Button size="sm" onClick={() => setSelectedAgency(agency)}>Contact<ExternalLink className="h-3 w-3 ml-1" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Knowledge Base Tab */}
                        <TabsContent value="knowledge" className="space-y-8">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-foreground mb-2">ศูนย์รวมความรู้สำหรับเริ่มต้นแบรนด์</h2>
                                <p className="text-muted-foreground">Everything you need to know before starting your brand</p>
                            </div>

                            {/* Key considerations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-primary" />
                                        {knowledgeBaseItems[0].title}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{knowledgeBaseItems[0].titleEn}</p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {knowledgeBaseItems[0].items?.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                                                </div>
                                                <span className="text-foreground">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Templates */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileCheck className="h-5 w-5 text-primary" />
                                        {knowledgeBaseItems[1].title}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{knowledgeBaseItems[1].titleEn}</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {knowledgeBaseItems[1].templates?.map((tpl) => (
                                            <div key={tpl.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                                                        <p className="text-xs text-muted-foreground">{tpl.type}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* External Resources */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ExternalLinkIcon className="h-5 w-5 text-primary" />
                                        {knowledgeBaseItems[2].title}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{knowledgeBaseItems[2].titleEn}</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {knowledgeBaseItems[2].links?.map((link) => (
                                            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors group">
                                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.name}</span>
                                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                            </a>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Award className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">AI Tip</h3>
                                <p className="text-sm text-muted-foreground">
                                    Registering as a company can save you up to 30% in taxes compared to operating as an
                                    individual. Plus, it&apos;s required for FDA registration.
                                </p>
                                <Link href="/chat/skincare-plus" className="text-sm text-primary hover:underline mt-2 inline-block">
                                    Return to Deal Room →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Partner Modal */}
            <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedPartner?.icon && <selectedPartner.icon className="h-5 w-5 text-primary" />}
                            {selectedPartner?.title}
                        </DialogTitle>
                        <DialogDescription>{selectedPartner?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <h4 className="font-medium text-foreground mb-2">Why is this needed?</h4>
                            <ul className="space-y-1">
                                {selectedPartner?.whyNeeded?.map((reason, idx) => (
                                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />{reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-foreground">{selectedPartner?.partnerName}</span>
                                <Badge variant="secondary">{selectedPartner?.partnerPrice}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Trusted partner with fast turnaround</p>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium text-foreground">Get a Quote</h4>
                            <div className="space-y-2"><Label>Name</Label><Input placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Phone</Label><Input placeholder="08X-XXX-XXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                        </div>
                        <Button className="w-full" onClick={handleSubmitLead}><Send className="h-4 w-4 mr-2" />Request Quote</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Agency Modal */}
            <Dialog open={!!selectedAgency} onOpenChange={() => setSelectedAgency(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedAgency?.name}</DialogTitle>
                        <DialogDescription><Badge variant="secondary" className="mt-1">{selectedAgency?.category}</Badge></DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 fill-warning text-warning" />
                                <span className="font-medium">{selectedAgency?.rating}</span>
                                <span className="text-muted-foreground">({selectedAgency?.reviews} reviews)</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{selectedAgency?.description}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Starting from</span>
                                <span className="font-semibold text-lg">{selectedAgency?.startingPrice}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {selectedAgency?.tags?.map((tag) => (<Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>))}
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium text-foreground">Request a Quote</h4>
                            <div className="space-y-2"><Label>Name</Label><Input placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Phone</Label><Input placeholder="08X-XXX-XXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                        </div>
                        <Button className="w-full" onClick={handleSubmitLead}><Send className="h-4 w-4 mr-2" />Contact Agency</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Contact Lawyer Modal */}
            <Dialog open={showLawyerModal} onOpenChange={setShowLawyerModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Gavel className="h-5 w-5 text-primary" /> Contact a Lawyer</DialogTitle>
                        <DialogDescription>Get professional legal assistance from our trusted partner</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 fill-warning text-warning" />
                                <span className="font-medium">{legalThaiAgency.rating}</span>
                                <span className="text-muted-foreground">({legalThaiAgency.reviews} reviews)</span>
                            </div>
                            <p className="font-medium text-foreground">{legalThaiAgency.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{legalThaiAgency.description}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Starting from</span>
                                <span className="font-semibold text-lg">{legalThaiAgency.startingPrice}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {legalThaiAgency.tags.map((tag) => (<Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>))}
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium text-foreground">Request Consultation</h4>
                            <div className="space-y-2"><Label>Name</Label><Input placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Phone</Label><Input placeholder="08X-XXX-XXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                        </div>
                        <Button className="w-full" onClick={handleSubmitLead}><Gavel className="h-4 w-4 mr-2" />Request Legal Consultation</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BrandLaunchpad;
