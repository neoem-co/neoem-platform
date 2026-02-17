"use client";

import Link from "next/link";
import { PartyPopper, Building2, FileSearch, ArrowRight, ChevronRight, Rocket } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalNudge() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="container py-8 md:py-12 px-4 flex-1">
                <div className="max-w-2xl mx-auto text-center space-y-6 md:space-y-8">
                    {/* Celebration Header */}
                    <div className="space-y-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                            <PartyPopper className="h-8 w-8 md:h-10 md:w-10 text-success" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Deal Confirmed! 🎉</h1>
                        <p className="text-sm md:text-base text-muted-foreground px-4">
                            Your contract has been sent to Thai Cosmetics Pro. They will review and respond within 24 hours.
                        </p>
                    </div>

                    {/* The Nudge */}
                    <Card className="border-warning/30 bg-warning/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg md:text-xl flex items-center justify-center gap-2">
                                Get Ready for Production & FDA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                To ensure smooth FDA registration and protect your brand, we recommend completing these steps:
                            </p>

                            <div className="space-y-3">
                                <Card className="bg-card hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-foreground">Register Company (DBD)</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Required for FDA registration and B2B contracts
                                            </p>
                                        </div>
                                        <Button className="w-full sm:w-auto">
                                            Fast Track
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <FileSearch className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="font-semibold text-foreground">Trademark Check</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Verify your brand name is available for registration
                                            </p>
                                        </div>
                                        <Button variant="outline" className="w-full sm:w-auto">
                                            Check Now
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="pt-4">
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                                >
                                    Continue as Individual (Not Recommended)
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Brand Launchpad CTA */}
                    <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Rocket className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-semibold text-foreground">Launch Your Brand</h3>
                                <p className="text-sm text-muted-foreground">
                                    Complete your brand setup while waiting for production
                                </p>
                            </div>
                            <Link href="/launchpad">
                                <Button className="w-full sm:w-auto">
                                    Brand Launchpad
                                    <Rocket className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full">
                                Go to Dashboard
                            </Button>
                        </Link>
                        <Link href="/factories" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full">
                                Browse More Factories
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
