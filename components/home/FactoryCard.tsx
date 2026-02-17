"use client";

import Link from "next/link";
import { Star, Trophy, BadgeCheck, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const factoryImages: Record<string, string> = {
    "factory-1": "/assets/factory-1.jpg",
    "factory-2": "/assets/factory-2.jpg",
    "factory-3": "/assets/factory-3.jpg",
    "factory-4": "/assets/factory-4.jpg",
    "factory-5": "/assets/factory-5.jpg",
};

interface FactoryCardProps {
    factory: {
        id: string;
        name: string;
        slug: string;
        verified: boolean;
        image: string;
        location: string;
        category: string;
        tags: string[];
        rating: number;
        reviewCount: number;
        onTimeDelivery: number;
        priceLevel: number;
        moq: number;
        specialties: string[];
    };
    variant?: "horizontal" | "vertical";
}

export function FactoryCard({ factory, variant = "vertical" }: FactoryCardProps) {
    const imageUrl = factoryImages[factory.image] || "/assets/factory-1.jpg";

    const PriceIndicator = () => (
        <span className="flex items-center text-muted-foreground">
            {Array.from({ length: 3 }).map((_, i) => (
                <DollarSign
                    key={i}
                    className={`h-3.5 w-3.5 ${i < factory.priceLevel ? "text-foreground" : "text-muted"}`}
                />
            ))}
        </span>
    );

    if (variant === "horizontal") {
        return (
            <Link
                href={`/factory/${factory.slug}`}
                className="factory-card flex gap-4 p-4 bg-card border rounded-lg hover:shadow-md"
            >
                <div className="w-48 h-32 flex-shrink-0 rounded-md overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={factory.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">{factory.name}</h3>
                            {factory.verified && (
                                <BadgeCheck className="h-5 w-5 text-success flex-shrink-0" />
                            )}
                        </div>
                        <PriceIndicator />
                    </div>

                    <p className="text-sm text-muted-foreground">{factory.location}</p>

                    <div className="flex flex-wrap gap-1.5">
                        {factory.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="font-medium">{factory.rating}</span>
                            <span className="text-muted-foreground">({factory.reviewCount})</span>
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <Trophy className="h-4 w-4 text-success" />
                            {factory.onTimeDelivery}% On-time
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/factory/${factory.slug}`}
            className="factory-card flex flex-col bg-card border rounded-lg overflow-hidden hover:shadow-md"
        >
            <div className="relative h-40 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={factory.name}
                    className="w-full h-full object-cover"
                />
                {factory.verified && (
                    <div className="absolute top-2 right-2 trust-badge">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                    </div>
                )}
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-foreground">{factory.name}</h3>
                    <p className="text-sm text-muted-foreground">{factory.location}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {factory.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-medium">{factory.rating}</span>
                    </span>
                    <PriceIndicator />
                </div>
            </div>
        </Link>
    );
}
