"use client";

import Link from "next/link";
import { Check, Crown, Zap, Building2, BadgeCheck, BarChart3, Image, Megaphone, Search, Users, FileText, Phone } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OEMAcquisitionHero } from "@/components/pricing/OEMAcquisitionHero";

const tiers = [
    {
        name: "Starter",
        subtitle: "สำหรับโรงงานเริ่มต้น",
        subtitleEn: "For Starters",
        price: "Free",
        priceSubtext: "ลงทะเบียนใช้งานฟรีตลอดชีพ",
        priceSubtextEn: "Free for lifetime",
        theme: "default",
        features: [
            { icon: Building2, text: "Basic Profile Creation" },
            { icon: Search, text: "Organic Search Visibility" },
            { icon: FileText, text: "AI Quotation Generator" },
            { icon: Image, text: "Upload max 5 Product Photos" },
        ],
        cta: "Get Started",
        ctaLink: "/oem-onboarding",
        ctaVariant: "outline" as const,
    },
    {
        name: "Pro",
        subtitle: "สร้างความน่าเชื่อถือ & ดู Insight",
        subtitleEn: "Build Trust & Insights",
        price: "฿ 1,590",
        pricePeriod: "/ month",
        priceSubtext: "฿ 15,900 / year",
        theme: "primary",
        popular: true,
        features: [
            { icon: Check, text: "Everything in Starter" },
            { icon: BadgeCheck, text: "Verified Badge (Green Check)" },
            { icon: BarChart3, text: "Access to Visitor Insights" },
            { icon: Image, text: "Unlimited Photos & Videos" },
            { icon: Megaphone, text: 'Free "Search Boost" Ad (1 time/month)' },
        ],
        cta: "Upgrade to Pro",
        ctaLink: "/oem-onboarding",
        ctaVariant: "default" as const,
    },
    {
        name: "Premium",
        subtitle: "ผู้นำตลาด & เข้าถึง Data เชิงลึก",
        subtitleEn: "Market Leader & Deep Data",
        price: "฿ 4,990",
        pricePeriod: "/ month",
        priceSubtext: "฿ 49,900 / year",
        theme: "premium",
        features: [
            { icon: Check, text: "Everything in Pro" },
            { icon: Building2, text: "On-site Factory Audit" },
            { icon: BarChart3, text: "Deep Market Trend Reports" },
            { icon: Crown, text: "Guaranteed Top Search Ranking" },
            { icon: Phone, text: "Dedicated Account Manager" },
        ],
        cta: "Contact Sales",
        ctaLink: "#",
        ctaVariant: "outline" as const,
    },
];

export default function Pricing() {
    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            {/* OEM Acquisition Hero */}
            <OEMAcquisitionHero />

            <div className="container py-12 md:py-20 flex-1">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <Badge variant="secondary" className="mb-4">
                        <Zap className="h-3 w-3 mr-1" />
                        Pricing Plans
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Choose Your Growth Plan
                    </h2>
                    <p className="text-muted-foreground">
                        All plans include access to our platform and AI-powered tools. Upgrade anytime.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {tiers.map((tier) => (
                        <Card
                            key={tier.name}
                            className={`relative flex flex-col ${tier.theme === "primary"
                                ? "border-primary shadow-lg md:scale-105"
                                : tier.theme === "premium"
                                    ? "border-destructive/50"
                                    : ""
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-2">
                                <CardTitle
                                    className={`text-xl ${tier.theme === "primary"
                                        ? "text-primary"
                                        : tier.theme === "premium"
                                            ? "text-destructive"
                                            : "text-foreground"
                                        }`}
                                >
                                    {tier.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                                <p className="text-xs text-muted-foreground">{tier.subtitleEn}</p>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                {/* Price */}
                                <div className="text-center py-4 border-b mb-6">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-3xl md:text-4xl font-bold text-foreground">
                                            {tier.price}
                                        </span>
                                        {tier.pricePeriod && (
                                            <span className="text-muted-foreground text-sm">
                                                {tier.pricePeriod}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {tier.priceSubtext}
                                    </p>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 flex-1">
                                    {tier.features.map((feature) => (
                                        <li key={feature.text} className="flex items-start gap-3">
                                            <feature.icon
                                                className={`h-5 w-5 flex-shrink-0 ${tier.theme === "primary"
                                                    ? "text-primary"
                                                    : tier.theme === "premium"
                                                        ? "text-destructive"
                                                        : "text-success"
                                                    }`}
                                            />
                                            <span className="text-sm text-foreground">{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <div className="mt-6 pt-6 border-t">
                                    <Button
                                        asChild
                                        variant={tier.ctaVariant}
                                        className={`w-full ${tier.theme === "primary" ? "bg-primary hover:bg-primary/90" : ""
                                            }`}
                                    >
                                        <Link href={tier.ctaLink}>{tier.cta}</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* FAQ / Trust Section */}
                <div className="mt-16 text-center">
                    <p className="text-muted-foreground">
                        Have questions?{" "}
                        <Link href="#" className="text-primary hover:underline">
                            Contact our sales team
                        </Link>
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
