"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import factoriesData from "@/data/factories.json";

export function OEMAcquisitionHero() {
    const factories = factoriesData.factories.slice(0, 6);

    return (
        <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-r from-primary via-primary/90 to-amber-500">
            {/* Background Carousel Effect */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute top-1/2 -translate-y-1/2 flex gap-6 animate-scroll-left">
                    {[...factories, ...factories].map((factory, idx) => (
                        <div
                            key={`${factory.id}-${idx}`}
                            className="w-64 flex-shrink-0"
                        >
                            <div className="bg-background/20 backdrop-blur rounded-xl p-4 h-48">
                                <div className="w-full h-24 bg-background/30 rounded-lg mb-3" />
                                <div className="h-4 w-3/4 bg-background/30 rounded mb-2" />
                                <div className="h-3 w-1/2 bg-background/30 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="container relative z-10">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
                        Join Thailand&apos;s Top Manufacturers
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
                        Connect with 10,000+ SMEs ready to build their brands.
                        Showcase your capabilities and grow your factory.
                    </p>
                    <Button
                        asChild
                        size="lg"
                        className="bg-background text-primary hover:bg-background/90 font-semibold px-8"
                    >
                        <Link href="/oem-onboarding">Register Your Factory</Link>
                    </Button>
                    <p className="text-sm text-primary-foreground/70 mt-4">
                        Free to start • No credit card required
                    </p>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg
                    viewBox="0 0 1440 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                        className="fill-secondary/20"
                    />
                </svg>
            </div>
        </section>
    );
}
