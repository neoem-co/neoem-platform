"use client";

import { use } from "react";
import Link from "next/link";
import {
    BadgeCheck, Star, Trophy, MapPin, MessageSquare,
    Building2, Award, Factory as FactoryIcon, ChevronRight
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import factoriesData from "@/data/factories.json";

const factoryImages: Record<string, string> = {
    "factory-1": "/assets/factory-1.jpg",
    "factory-2": "/assets/factory-2.jpg",
    "factory-3": "/assets/factory-3.jpg",
    "factory-4": "/assets/factory-4.jpg",
    "factory-5": "/assets/factory-5.jpg",
};

export default function FactoryDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const factory = factoriesData.factories.find((f) => f.slug === slug);

    if (!factory) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-20 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Factory not found</h1>
                    <Link href="/factories" className="text-primary hover:underline mt-4 inline-block">
                        Browse all factories
                    </Link>
                </div>
            </div>
        );
    }

    const imageUrl = factoryImages[factory.image] || "/assets/factory-1.jpg";

    const revenueData = factory.revenueHistory.map((item) => ({
        year: item.year,
        revenue: item.revenue / 1000000,
    }));

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            {/* Breadcrumb */}
            <div className="border-b bg-background">
                <div className="container py-3 px-4">
                    <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground overflow-x-auto">
                        <Link href="/" className="hover:text-foreground whitespace-nowrap">Home</Link>
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        <Link href="/factories" className="hover:text-foreground whitespace-nowrap">Factories</Link>
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        <span className="text-foreground truncate">{factory.name}</span>
                    </nav>
                </div>
            </div>

            {/* Sticky Header */}
            <div className="sticky top-14 md:top-16 z-40 border-b bg-background/95 backdrop-blur">
                <div className="container py-3 md:py-4 px-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img src={imageUrl} alt={factory.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-foreground text-sm md:text-base truncate">{factory.name}</h1>
                                {factory.verified && (
                                    <BadgeCheck className="h-4 v-4 md:h-5 md:w-5 text-success flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="truncate">{factory.location}</span>
                            </div>
                        </div>
                    </div>

                    <Link href={`/chat/${factory.slug}`}>
                        <Button size="sm" className="md:size-default">
                            <MessageSquare className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Chat / Request Quote</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="container py-6 md:py-8 px-4">
                <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Hero Image */}
                        <div className="rounded-xl overflow-hidden h-48 md:h-64 lg:h-80">
                            <img src={imageUrl} alt={factory.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="w-full justify-start overflow-x-auto">
                                <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                                <TabsTrigger value="products" className="text-xs md:text-sm">Products</TabsTrigger>
                                <TabsTrigger value="machines" className="text-xs md:text-sm">Machines</TabsTrigger>
                                <TabsTrigger value="portfolio" className="text-xs md:text-sm">Portfolio</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="mt-4 md:mt-6 space-y-6">
                                {/* Description */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base md:text-lg">About</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{factory.description}</p>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {factory.specialties.map((specialty) => (
                                                <Badge key={specialty} variant="secondary" className="text-xs">
                                                    {specialty}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Financial Health */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            Financial Health
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Status</span>
                                            <span className={`trust-badge ${factory.financialHealth === "Excellent" ? "bg-success/10 text-success" : ""}`}>
                                                {factory.financialHealth}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Registered Capital</span>
                                            <span className="font-medium text-foreground">
                                                ฿{factory.registeredCapital.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="pt-4">
                                            <p className="text-xs md:text-sm text-muted-foreground mb-4">Revenue Growth (Million THB)</p>
                                            <div className="h-40 md:h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={revenueData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: "hsl(var(--card))",
                                                                border: "1px solid hsl(var(--border))",
                                                                borderRadius: "8px",
                                                                fontSize: "12px"
                                                            }}
                                                            formatter={(value: any) => [`฿${value}M`, "Revenue"] as any}
                                                        />
                                                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-xs text-success mt-2">
                                                ✓ Data verified by DBD
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="products" className="mt-4 md:mt-6">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                            {factory.specialties.map((specialty) => (
                                                <div key={specialty} className="p-3 md:p-4 bg-secondary/50 rounded-lg text-center">
                                                    <FactoryIcon className="h-6 w-6 md:h-8 md:w-8 mx-auto text-primary mb-2" />
                                                    <p className="font-medium text-foreground text-xs md:text-sm">{specialty}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="machines" className="mt-4 md:mt-6">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-3 md:space-y-4">
                                            {factory.machines.map((machine) => (
                                                <div key={machine.name} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-secondary/50 rounded-lg">
                                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FactoryIcon className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground text-sm md:text-base">{machine.name}</p>
                                                        <p className="text-xs md:text-sm text-muted-foreground">Capacity: {machine.capacity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="portfolio" className="mt-4 md:mt-6">
                                <Card>
                                    <CardContent className="pt-6 text-center text-muted-foreground">
                                        <p className="text-sm">Portfolio samples available upon request.</p>
                                        <Link href={`/chat/${factory.slug}`}>
                                            <Button className="mt-4">Request Portfolio</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 md:space-y-6">
                        {/* Quick Stats */}
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Star className="h-4 w-4" />
                                        Rating
                                    </span>
                                    <span className="font-semibold text-foreground flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-primary text-primary" />
                                        {factory.rating} ({factory.reviewCount})
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Trophy className="h-4 w-4" />
                                        On-time Delivery
                                    </span>
                                    <span className="font-semibold text-success">{factory.onTimeDelivery}%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Min. Order</span>
                                    <span className="font-semibold text-foreground">{factory.moq} pcs</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Certifications */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    Certifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {factory.certifications.map((cert) => (
                                        <div key={cert} className="flex items-center gap-2 p-2 bg-success/5 rounded-lg">
                                            <BadgeCheck className="h-4 w-4 text-success" />
                                            <span className="text-sm text-foreground">{cert}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* CTA */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6 text-center">
                                <h3 className="font-semibold text-foreground mb-2">Ready to start?</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Chat with this factory and get an AI-generated contract.
                                </p>
                                <Link href={`/chat/${factory.slug}`} className="block">
                                    <Button className="w-full">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Start Conversation
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
