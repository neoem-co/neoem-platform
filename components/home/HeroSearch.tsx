"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeAnimation } from "react-type-animation";

const categories = [
    { id: "cosmetics", label: "Cosmetics" },
    { id: "supplements", label: "Supplements" },
    { id: "packaging", label: "Packaging" },
    { id: "clothing", label: "Clothing" },
    { id: "skincare", label: "Skincare" },
    { id: "food", label: "Food & Beverage" },
];

export function HeroSearch() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/factories${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    };

    const handleTagClick = (categoryId: string) => {
        router.push(`/factories?category=${categoryId}`);
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    The Operating System for
                </h1>
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
                    <TypeAnimation
                        sequence={[
                            "Manufacturing",
                            2000,
                            "SME Success",
                            2000,
                            "Trusted Deals",
                            2000,
                            "Future Growth",
                            2000,
                        ]}
                        wrapper="span"
                        speed={50}
                        repeat={Infinity}
                        cursor={true}
                    />
                </div>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Connect with verified OEM factories. From idea to production in one intelligent platform.
                </p>
            </div>

            <form onSubmit={handleSearch} className="relative">
                <div className="search-hero flex items-center gap-3 bg-card border rounded-xl p-2 shadow-sm transition-all">
                    <div className="flex items-center gap-2 px-3 text-muted-foreground">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tell us your idea... (e.g., Whitening Cream, MOQ 500 pcs, Budget 50k)"
                        className="flex-1 h-12 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                    />
                    <Button type="submit" size="lg" className="h-12 px-6">
                        <Search className="h-5 w-5 mr-2" />
                        Search
                    </Button>
                </div>
            </form>

            <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Popular:</span>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleTagClick(cat.id)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
