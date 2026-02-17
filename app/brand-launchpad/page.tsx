"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Building2,
    FileCheck,
    Palette,
    Shield,
    Award,
    Lightbulb,
    Check,
    ChevronRight,
    Rocket,
    Send,
    Briefcase,
    Megaphone,
    Calculator,
    Scale,
    Code,
    Truck,
    PartyPopper,
    Users,
    Star,
    ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LaunchpadItem {
    id: string;
    title: string;
    titleTh: string;
    description: string;
    icon: typeof Building2;
    phase: number;
    category: "all" | "cosmetics" | "supplements";
    partnerName?: string;
    partnerPrice?: string;
    whyNeeded?: string[];
}

const launchpadItems: LaunchpadItem[] = [
    {
        id: "company-registration",
        title: "Register Company (DBD)",
        titleTh: "จดทะเบียนบริษัท",
        description: "Establish your legal business entity with the Department of Business Development",
        icon: Building2,
        phase: 1,
        category: "all",
        partnerName: "DBD Fast Track Partner",
        partnerPrice: "฿ 8,500",
        whyNeeded: [
            "Required for FDA registration",
            "Enables business tax benefits",
            "Builds customer trust",
            "Required for B2B contracts",
        ],
    },
    {
        id: "logo-design",
        title: "Logo & Brand Design",
        titleTh: "ออกแบบโลโก้และแบรนด์",
        description: "Create professional branding assets for your product line",
        icon: Palette,
        phase: 1,
        category: "all",
        partnerName: "Creative Design Studio",
        partnerPrice: "฿ 5,900",
        whyNeeded: [
            "First impression matters",
            "Required for trademark registration",
            "Professional packaging design",
            "Marketing materials ready",
        ],
    },
    {
        id: "trademark",
        title: "Trademark Registration (IP)",
        titleTh: "จดเครื่องหมายการค้า",
        description: "Protect your brand name and logo with intellectual property registration",
        icon: Shield,
        phase: 2,
        category: "all",
        partnerName: "IP Thailand Services",
        partnerPrice: "฿ 12,500",
        whyNeeded: [
            "Prevent brand copying",
            "Legal ownership proof",
            "Required for marketplace listing",
            "Long-term brand value",
        ],
    },
    {
        id: "fda-cosmetics",
        title: "FDA Notification (Jor-Or)",
        titleTh: "แจ้ง จ.อ. เครื่องสำอาง",
        description: "Register your cosmetic product with Thai FDA for legal sale",
        icon: FileCheck,
        phase: 2,
        category: "cosmetics",
        partnerName: "FDA Consultant Pro",
        partnerPrice: "฿ 3,500 / SKU",
        whyNeeded: [
            "Legally required for cosmetics",
            "Required for e-commerce platforms",
            "Build consumer trust",
            "Avoid legal penalties",
        ],
    },
    {
        id: "fda-supplements",
        title: "FDA License (Sor-Bor)",
        titleTh: "ขอ อ.ย. อาหารเสริม",
        description: "Obtain FDA license for supplement products - more stringent requirements",
        icon: FileCheck,
        phase: 2,
        category: "supplements",
        partnerName: "Supplement FDA Expert",
        partnerPrice: "฿ 25,000 / SKU",
        whyNeeded: [
            "Mandatory for supplement sale",
            "Includes lab testing",
            "GMP factory verification",
            "Claim approval process",
        ],
    },
    {
        id: "patent",
        title: "Patent Application (Optional)",
        titleTh: "จดสิทธิบัตร (ตัวเลือก)",
        description: "Protect unique formulations or innovations with patent registration",
        icon: Lightbulb,
        phase: 3,
        category: "all",
        partnerName: "Patent Thailand",
        partnerPrice: "฿ 45,000+",
        whyNeeded: [
            "Protect unique innovations",
            "Competitive advantage",
            "Licensing opportunities",
            "Investment attraction",
        ],
    },
];

// Agency marketplace data
interface Agency {
    id: string;
    name: string;
    category: string;
    rating: number;
    reviews: number;
    startingPrice: string;
    description: string;
    portfolio: string[];
    tags: string[];
}

const agencies: Agency[] = [
    {
        id: "bc-1",
        name: "SME Strategy Partners",
        category: "Business Consultant",
        rating: 4.9,
        reviews: 127,
        startingPrice: "฿15,000",
        description: "Strategic planning and business model development for SMEs and startups",
        portfolio: ["Brand expansion", "Market entry", "Investor pitch"],
        tags: ["Strategy", "Planning", "Growth"],
    },
    {
        id: "mk-1",
        name: "Digital Wave Agency",
        category: "Marketing Agency",
        rating: 4.8,
        reviews: 89,
        startingPrice: "฿25,000/mo",
        description: "Full-service digital marketing including social media, ads, and content",
        portfolio: ["Social Media", "Facebook Ads", "Content Creation"],
        tags: ["Digital", "Social", "Ads"],
    },
    {
        id: "mk-2",
        name: "BrandCraft Studio",
        category: "Marketing Agency",
        rating: 4.7,
        reviews: 64,
        startingPrice: "฿8,000",
        description: "Brand identity, packaging design, and visual marketing materials",
        portfolio: ["Branding", "Packaging", "Photography"],
        tags: ["Branding", "Design", "Visual"],
    },
    {
        id: "ac-1",
        name: "TaxPro Accounting",
        category: "Accounting & Audit",
        rating: 4.9,
        reviews: 156,
        startingPrice: "฿3,500/mo",
        description: "Company registration, monthly bookkeeping, and tax filing services",
        portfolio: ["Company Reg", "Bookkeeping", "Tax Filing"],
        tags: ["Tax", "Accounting", "Registration"],
    },
    {
        id: "lg-1",
        name: "LegalThai Associates",
        category: "Legal Firm",
        rating: 4.8,
        reviews: 78,
        startingPrice: "฿5,000",
        description: "FDA registration, trademark filing, and contract drafting services",
        portfolio: ["FDA", "Trademark", "Contracts"],
        tags: ["FDA", "IP", "Contracts"],
    },
    {
        id: "sw-1",
        name: "CodeCraft Solutions",
        category: "Software House",
        rating: 4.6,
        reviews: 43,
        startingPrice: "฿50,000",
        description: "E-commerce websites, mobile apps, and CRM development",
        portfolio: ["E-commerce", "Mobile App", "CRM"],
        tags: ["Web", "App", "E-commerce"],
    },
    {
        id: "lo-1",
        name: "SwiftShip Logistics",
        category: "Logistics",
        rating: 4.7,
        reviews: 112,
        startingPrice: "฿15/order",
        description: "Warehousing, fulfillment, and nationwide shipping solutions",
        portfolio: ["Fulfillment", "Warehouse", "COD"],
        tags: ["Shipping", "Warehouse", "Fulfillment"],
    },
    {
        id: "ev-1",
        name: "LaunchPad Events",
        category: "Event & Venue",
        rating: 4.5,
        reviews: 31,
        startingPrice: "฿35,000",
        description: "Product launch events, pop-up stores, and brand activations",
        portfolio: ["Launch Events", "Pop-ups", "Exhibitions"],
        tags: ["Events", "Launch", "Activation"],
    },
    {
        id: "in-1",
        name: "InfluenceThai",
        category: "Influencer Agency",
        rating: 4.6,
        reviews: 67,
        startingPrice: "฿10,000",
        description: "KOL matching, influencer campaigns, and UGC content creation",
        portfolio: ["KOL", "TikTok", "Instagram"],
        tags: ["Influencer", "KOL", "UGC"],
    },
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

// Progress tracker steps
const progressSteps = [
    { id: 1, label: "Idea", completed: true },
    { id: 2, label: "Matching", completed: true },
    { id: 3, label: "Quotation", completed: true },
    { id: 4, label: "Contract", completed: false },
    { id: 5, label: "Launchpad", completed: false },
    { id: 6, label: "Go to Market", completed: false },
];

export default function BrandLaunchpad() {
    const [category, setCategory] = useState<"all" | "cosmetics" | "supplements">("all");
    const [completedItems, setCompletedItems] = useState<string[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<LaunchpadItem | null>(null);
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
    const [agencyCategory, setAgencyCategory] = useState("all");

    const filteredItems = launchpadItems.filter(
        (item) => item.category === "all" || item.category === category
    );

    const filteredAgencies = agencyCategory === "all"
        ? agencies
        : agencies.filter(a => a.category === agencyCategory);

    const phases = [
        { number: 1, title: "Foundation", titleTh: "รากฐาน" },
        { number: 2, title: "Compliance", titleTh: "การปฏิบัติตามกฎหมาย" },
        { number: 3, title: "Growth", titleTh: "เติบโต" },
    ];

    const progress = filteredItems.length > 0 ? Math.round((completedItems.length / filteredItems.length) * 100) : 0;
    const currentProgressStep = progressSteps.findIndex(s => !s.completed) + 1;

    const toggleComplete = (id: string) => {
        setCompletedItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSubmitLead = () => {
        console.log("Lead submitted:", { partner: selectedPartner?.partnerName || selectedAgency?.name, ...formData });
        setSelectedPartner(null);
        setSelectedAgency(null);
        setFormData({ name: "", phone: "", email: "" });
    };

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            {/* Progress Tracker */}
            <section className="bg-background border-b py-4">
                <div className="container">
                    <div className="flex items-center justify-between overflow-x-auto pb-2">
                        {progressSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-shrink-0">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.completed
                                        ? "bg-success text-success-foreground"
                                        : index === currentProgressStep - 1
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }`}>
                                        {step.completed ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span className={`text-xs mt-1 whitespace-nowrap ${step.completed || index === currentProgressStep - 1
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground"
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < progressSteps.length - 1 && (
                                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${step.completed ? "bg-success" : "bg-muted"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="relative py-12 md:py-16 bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
                <div className="container relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <Badge variant="secondary" className="mb-4">
                            <Rocket className="h-3 w-3 mr-1" />
                            Brand Launchpad
                        </Badge>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                            Your Brand Roadmap
                        </h1>
                        <p className="text-muted-foreground text-lg mb-8">
                            Complete these steps while your products are being manufactured. Build a compliant,
                            protected brand from day one.
                        </p>

                        {/* Progress Bar */}
                        <div className="bg-card border rounded-xl p-6 max-w-md mx-auto">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                                <span className="text-sm font-bold text-primary">{progress}% Ready</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {completedItems.length} of {filteredItems.length} tasks completed
                            </p>
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
                        </TabsList>

                        {/* Checklist Tab */}
                        <TabsContent value="checklist" className="space-y-6">
                            {/* Category Selector */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-background rounded-lg border">
                                <span className="text-sm font-medium text-foreground">Product Category:</span>
                                <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">General Products</SelectItem>
                                        <SelectItem value="cosmetics">Cosmetics (เครื่องสำอาง)</SelectItem>
                                        <SelectItem value="supplements">Supplements (อาหารเสริม)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Timeline Roadmap */}
                            <div className="space-y-12">
                                {phases.map((phase) => {
                                    const phaseItems = filteredItems.filter((item) => item.phase === phase.number);
                                    if (phaseItems.length === 0) return null;

                                    return (
                                        <div key={phase.number}>
                                            {/* Phase Header */}
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                                    {phase.number}
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-foreground">
                                                        Phase {phase.number}: {phase.title}
                                                    </h2>
                                                    <p className="text-sm text-muted-foreground">{phase.titleTh}</p>
                                                </div>
                                            </div>

                                            {/* Phase Cards */}
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-0 md:ml-14">
                                                {phaseItems.map((item) => {
                                                    const isCompleted = completedItems.includes(item.id);

                                                    return (
                                                        <Card
                                                            key={item.id}
                                                            className={`transition-all ${isCompleted ? "opacity-60 bg-muted/50" : "hover:shadow-md"
                                                                }`}
                                                        >
                                                            <CardHeader className="pb-3">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <div
                                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? "bg-success/20" : "bg-primary/10"
                                                                                }`}
                                                                        >
                                                                            {isCompleted ? (
                                                                                <Check className="h-5 w-5 text-success" />
                                                                            ) : (
                                                                                <item.icon className="h-5 w-5 text-primary" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <CardTitle className="text-base">{item.title}</CardTitle>
                                                                            <p className="text-xs text-muted-foreground">{item.titleTh}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Checkbox
                                                                        checked={isCompleted}
                                                                        onCheckedChange={() => toggleComplete(item.id)}
                                                                    />
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                                                                {!isCompleted && item.partnerName && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full"
                                                                        onClick={() => setSelectedPartner(item)}
                                                                    >
                                                                        Hire Expert
                                                                        <ChevronRight className="h-4 w-4 ml-1" />
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

                        {/* Agency Marketplace Tab */}
                        <TabsContent value="marketplace" className="space-y-6">
                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-2">
                                {agencyCategories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant={agencyCategory === cat.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setAgencyCategory(cat.id)}
                                        className="gap-2"
                                    >
                                        <cat.icon className="h-4 w-4" />
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Agency Cards */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredAgencies.map((agency) => (
                                    <Card key={agency.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Badge variant="secondary" className="mb-2">
                                                        {agency.category}
                                                    </Badge>
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

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1">
                                                {agency.tags.map((tag) => (
                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {/* Portfolio */}
                                            <div className="flex gap-2">
                                                {agency.portfolio.map((item) => (
                                                    <span
                                                        key={item}
                                                        className="text-xs bg-secondary/50 px-2 py-1 rounded"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Starting from</p>
                                                    <p className="font-semibold text-foreground">{agency.startingPrice}</p>
                                                </div>
                                                <Button size="sm" onClick={() => setSelectedAgency(agency)}>
                                                    Contact
                                                    <ExternalLink className="h-3 w-3 ml-1" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* AI Tip Banner */}
                    <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Award className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">AI Tip</h3>
                                <p className="text-sm text-muted-foreground">
                                    Registering as a company can save you up to 30% in taxes compared to operating as an
                                    individual. Plus, it&apos;s required for FDA registration. Start with company registration
                                    to unlock all compliance options.
                                </p>
                                <Link
                                    href="/chat/skincare-plus"
                                    className="text-sm text-primary hover:underline mt-2 inline-block"
                                >
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
                            {selectedPartner?.icon && (
                                <selectedPartner.icon className="h-5 w-5 text-primary" />
                            )}
                            {selectedPartner?.title}
                        </DialogTitle>
                        <DialogDescription>{selectedPartner?.description}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Why Needed */}
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <h4 className="font-medium text-foreground mb-2">Why is this needed?</h4>
                            <ul className="space-y-1">
                                {selectedPartner?.whyNeeded?.map((reason, idx) => (
                                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Partner Offer */}
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-foreground">{selectedPartner?.partnerName}</span>
                                <Badge variant="secondary">{selectedPartner?.partnerPrice}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Trusted partner with fast turnaround and expert support
                            </p>
                        </div>

                        {/* Lead Form */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-foreground">Get a Quote</h4>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="08X-XXX-XXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleSubmitLead}>
                            <Send className="h-4 w-4 mr-2" />
                            Request Quote
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Agency Modal */}
            <Dialog open={!!selectedAgency} onOpenChange={() => setSelectedAgency(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedAgency?.name}
                        </DialogTitle>
                        <DialogDescription>
                            <Badge variant="secondary" className="mt-1">{selectedAgency?.category}</Badge>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Agency Info */}
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="h-4 w-4 fill-warning text-warning" />
                                <span className="font-medium">{selectedAgency?.rating}</span>
                                <span className="text-muted-foreground">({selectedAgency?.reviews} reviews)</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{selectedAgency?.description}</p>
                        </div>

                        {/* Pricing */}
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Starting from</span>
                                <span className="font-semibold text-lg">{selectedAgency?.startingPrice}</span>
                            </div>
                        </div>

                        {/* Lead Form */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-foreground">Request a Quote</h4>
                            <div className="space-y-2">
                                <Label htmlFor="agency-name">Name</Label>
                                <Input
                                    id="agency-name"
                                    placeholder="Your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="agency-phone">Phone</Label>
                                <Input
                                    id="agency-phone"
                                    placeholder="08X-XXX-XXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="agency-email">Email</Label>
                                <Input
                                    id="agency-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleSubmitLead}>
                            <Send className="h-4 w-4 mr-2" />
                            Contact Agency
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
