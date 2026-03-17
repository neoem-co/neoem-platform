"use client";

import { Link } from "@/i18n/routing";
import { toast } from "sonner";

export function Footer() {
    const handleComingSoon = (e: React.MouseEvent) => {
        e.preventDefault();
        toast.info("Coming Soon", {
            description: "This feature is part of our upcoming NEOEM V.4 update.",
        });
    };

    const footerSections = [
        {
            title: "NEOEM",
            links: [
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Careers", href: "/careers" },
            ],
        },
        {
            title: "Ecosystem",
            links: [
                { label: "Match (Find OEM)", href: "/factories" },
                { label: "Verify Status", href: "/factories", comingSoon: true },
                { label: "Protect (AI Middleman)", href: "#", comingSoon: true },
                { label: "Escrow", href: "#", comingSoon: true },
                { label: "AI Contracts", href: "/factories" },
                { label: "Grow (Brand Launchpad)", href: "/brand-launchpad" },
            ],
        },
        {
            title: "Resources",
            links: [
                { label: "Knowledge Base", href: "#", comingSoon: true },
                { label: "Dispute Resolution", href: "#", comingSoon: true },
                { label: "SME Guidelines", href: "#", comingSoon: true },
                { label: "OEM Guidelines", href: "#", comingSoon: true },
            ],
        },
        {
            title: "Legal",
            links: [
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Escrow Policy", href: "#", comingSoon: true },
            ],
        },
    ];

    return (
        <footer className="bg-card border-t">
            <div className="container py-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Logo & Description */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <img src="/assets/neoem-logo.png" alt="NEOEM" className="h-10 w-auto" />
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            The Operating System for Manufacturing. Connecting SMEs with OEM factories.
                        </p>
                    </div>

                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
                            <ul className="space-y-2">
{section.links.map((link) => (
    <li key={link.label}>
        {link.comingSoon ? (
            <button
                onClick={handleComingSoon}
                className="text-sm text-muted-foreground hover:text-primary transition-colors text-left w-full"
            >
                {link.label}
            </button>
        ) : (
            <Link
                href={link.href as any}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                {link.label}
            </Link>
        )}
    </li>
))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © 2026 NEOEM. All rights reserved.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Powered by DBD Thailand, iAPP (OCR & Thanoy AI), and Opn Payments
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
