"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Search, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const factoryImages: Record<string, string> = {
    "factory-1": "/assets/factory-1.jpg",
    "factory-2": "/assets/factory-2.jpg",
    "factory-3": "/assets/factory-3.jpg",
    "factory-4": "/assets/factory-4.jpg",
    "factory-5": "/assets/factory-5.jpg",
};

const conversations = [
    {
        id: "1",
        factorySlug: "thai-cosmetics-pro",
        factoryName: "Thai Cosmetics Pro",
        factoryImage: "factory-1",
        lastMessage: "Please review and let me know if you'd like to proceed.",
        timestamp: "2h ago",
        unread: true,
        status: "active",
    },
    {
        id: "2",
        factorySlug: "siam-herbal-extract",
        factoryName: "Siam Herbal Extract",
        factoryImage: "factory-2",
        lastMessage: "We can start production once deposit is received.",
        timestamp: "1d ago",
        unread: false,
        status: "pending-deposit",
    },
    {
        id: "3",
        factorySlug: "pure-skin-lab",
        factoryName: "Pure Skin Lab Innovation",
        factoryImage: "factory-3",
        lastMessage: "Thank you for your interest! What formulation are you looking for?",
        timestamp: "3d ago",
        unread: false,
        status: "active",
    },
    {
        id: "4",
        factorySlug: "ecopack-solutions",
        factoryName: "EcoPack Solutions",
        factoryImage: "factory-4",
        lastMessage: "Sample packaging has been shipped.",
        timestamp: "1w ago",
        unread: false,
        status: "production",
    },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case "pending-deposit":
            return <Badge variant="outline" className="text-warning border-warning text-xs">Pending Deposit</Badge>;
        case "production":
            return <Badge variant="outline" className="text-success border-success text-xs">In Production</Badge>;
        default:
            return null;
    }
};

export default function Messages() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter((conv) =>
        conv.factoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            <div className="container py-6 md:py-8 flex-1">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            Messages
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Your conversations with factories
                        </p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">All Conversations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredConversations.length === 0 ? (
                            <div className="p-8 text-center">
                                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No conversations found</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredConversations.map((conv) => (
                                    <Link
                                        key={conv.id}
                                        href={`/chat/${conv.factorySlug}`}
                                        className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full overflow-hidden">
                                                <img
                                                    src={factoryImages[conv.factoryImage] || "/assets/factory-1.jpg"}
                                                    alt={conv.factoryName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {conv.unread && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                    <span className="text-[10px] text-primary-foreground font-bold">1</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-medium ${conv.unread ? "text-foreground" : "text-foreground/80"}`}>
                                                    {conv.factoryName}
                                                </span>
                                                {getStatusBadge(conv.status)}
                                            </div>
                                            <p className={`text-sm truncate ${conv.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
}
