"use client";

import { useState } from "react";
import { FileText, FileCheck, ShieldAlert, BadgeCheck, Landmark, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
    { id: "all", label: "All" },
    { id: "smart-contracts", label: "Smart Contracts" },
    { id: "trust-security", label: "Trust & Security" },
    { id: "growth-hub", label: "Growth Hub" },
];

const features = [
    {
        icon: FileText,
        title: "AI Draft Contract",
        desc: "Generate accurate contracts",
        category: "smart-contracts",
    },
    {
        icon: ShieldAlert,
        title: "AI Check Risk",
        desc: "Detect legal loopholes",
        category: "smart-contracts",
    },
    {
        icon: FileCheck,
        title: "Contract Template",
        desc: "Ready-to-use standards",
        category: "smart-contracts",
    },
    {
        icon: BadgeCheck,
        title: "OEM Verify",
        desc: "DBD factory verification",
        category: "trust-security",
    },
    {
        icon: Landmark,
        title: "Escrow Payment",
        desc: "Secure fund holding",
        category: "trust-security",
    },
    {
        icon: Rocket,
        title: "Brand Launchpad",
        desc: "Guides, resources & expert networking",
        category: "growth-hub",
    },
];

export function FeatureShowcase() {
    const [activeCategory, setActiveCategory] = useState("all");

    const filtered = activeCategory === "all"
        ? features
        : features.filter((f) => f.category === activeCategory);

    return (
        <section className="py-12">
            <div className="container">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        Secure Every Step with LegalTech
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Integrated AI legal tools designed to protect your business, prevent exploitation, and build trust from the first chat to the final delivery.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                    {categories.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setActiveCategory(c.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === c.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                {/* Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((f) => (
                        <Card
                            key={f.title}
                            className="group hover:shadow-lg transition-shadow bg-card"
                        >
                            <CardContent className="p-5 text-center space-y-3">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                                    <f.icon className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                                <p className="text-xs text-muted-foreground">{f.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
