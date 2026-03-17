"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

export function LanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = (newLocale: "en" | "th") => {
        // Remove existing locale from pathname if present
        const pathParts = pathname.split('/').filter(Boolean);
        const currentLocale = pathParts[0];
        
        // If current path starts with a locale, remove it
        if (['en', 'th'].includes(currentLocale)) {
            pathParts.shift();
        }
        
        const newPath = `/${newLocale}/${pathParts.join('/')}`;
        router.replace(newPath);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                    <Languages className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase">{locale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleLanguage("en")} className={locale === "en" ? "bg-accent" : ""}>
                    English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleLanguage("th")} className={locale === "th" ? "bg-accent" : ""}>
                    ไทย (TH)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
