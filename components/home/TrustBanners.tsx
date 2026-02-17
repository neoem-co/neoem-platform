const partners = [
    {
        name: "DBD Thailand",
        description: "Verified Business Registry",
        logo: "/assets/partner-dbd.png",
    },
    {
        name: "iAPP (OCR & Thanoy AI)",
        description: "AI-Powered Legal Analysis",
        logo: "/assets/partner-iapp.png",
    },
    {
        name: "Typhoon",
        description: "LLMs and RAG",
        logo: "/assets/partner-typhoon.png",
    },
    {
        name: "Opn Payments",
        description: "Secure Split Payments",
        logo: "/assets/partner-omise.png",
    },
];

export function TrustBanners() {
    return (
        <div className="w-full py-8 border-t border-b bg-secondary/30">
            <div className="container">
                <p className="text-center text-sm text-muted-foreground mb-6">
                    Powered by leading technology partners
                </p>
                <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
                    {partners.map((partner) => (
                        <div key={partner.name} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center p-1">
                                <img
                                    src={partner.logo}
                                    alt={partner.name}
                                    className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all"
                                />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-foreground">{partner.name}</p>
                                <p className="text-xs text-muted-foreground">{partner.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
