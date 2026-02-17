import Link from "next/link";

export function Footer() {
    const footerLinks = {
        platform: [
            { label: "Home", href: "/" },
            { label: "Search Factories", href: "/factories" },
            { label: "Factory List", href: "/factories" },
        ],
        features: [
            { label: "Chat Deal Room", href: "/factories" },
            { label: "Brand Launchpad", href: "/launchpad" },
            { label: "AI Contract Review", href: "/factories" },
        ],
        forFactories: [
            { label: "Join as OEM", href: "/oem-onboarding" },
            { label: "Pricing & Plans", href: "/pricing" },
            { label: "OEM Dashboard", href: "/oem-dashboard" },
        ],
        legal: [
            { label: "Privacy Policy", href: "#" },
            { label: "Terms of Service", href: "#" },
            { label: "Contact Us", href: "#" },
        ],
    };

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

                    {/* Platform Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Platform</h3>
                        <ul className="space-y-2">
                            {footerLinks.platform.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Features Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Features</h3>
                        <ul className="space-y-2">
                            {footerLinks.features.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Factories Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">For Factories</h3>
                        <ul className="space-y-2">
                            {footerLinks.forFactories.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
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
