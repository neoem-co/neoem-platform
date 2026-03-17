"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, User, Menu, Building2, ShoppingBag, Rocket, MessageSquare, Package, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import neoemLogo from "@/public/assets/neoem-logo.png";
import { LanguageToggle } from "./LanguageToggle";

const mockNotifications = [
    { id: 1, icon: CheckCircle2, message: "Thai Cosmetics Pro accepted your quote", time: "2 min ago", read: false },
    { id: 2, icon: CreditCard, message: "Deposit payment confirmed — ฿36,000", time: "1 hour ago", read: false },
    { id: 3, icon: Package, message: "Order NEO-2026-001 entered production", time: "3 hours ago", read: true },
];

export function Navbar() {
    const t = useTranslations("Navbar");
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const [open, setOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [readNotifs, setReadNotifs] = useState<number[]>([3]);

    // Normalize pathname (remove /en or /th prefix)
    const normalizedPathname = pathname.replace(/^\/(en|th)/, "") || "/";

    const navLinks = [
        { href: "/factories", label: t("findFactories"), active: normalizedPathname === "/factories" },
        { href: "/brand-launchpad", label: t("brandLaunchpad"), active: normalizedPathname === "/brand-launchpad" },
        { href: "/dashboard", label: t("dashboard"), active: normalizedPathname === "/dashboard" },
        { href: "/pricing", label: t("forFactories"), active: normalizedPathname === "/pricing" },
    ];

    const unreadCount = mockNotifications.filter(n => !readNotifs.includes(n.id)).length;

    const handleSwitch = (path: string) => {
        router.push(`/${locale}${path}`);
    };

    const handleMarkAllRead = () => {
        setReadNotifs(mockNotifications.map(n => n.id));
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 md:h-16 items-center justify-between">
                <Link href={`/${locale}`} className="flex items-center gap-2">
                    <img src={neoemLogo.src} alt="NEOEM" className="h-8 md:h-10 w-auto" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={`/${locale}${link.href}`}
                            className={`text-sm font-medium transition-colors hover:text-primary ${link.active ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Language Switcher */}
                    <LanguageToggle />

                    {/* Messages Icon */}
                    <Link href={`/${locale}/messages`}>
                        <Button variant="ghost" size="icon" className={`relative ${normalizedPathname === "/messages" ? "text-primary" : ""}`}>
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                    </Link>

                    {/* Notification Bell with Dropdown */}
                    <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="flex items-center justify-between px-3 py-2">
                                <DropdownMenuLabel className="p-0">{t("notifications")}</DropdownMenuLabel>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={handleMarkAllRead}>
                                        Mark all read
                                    </Button>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            {mockNotifications.map((notif) => {
                                const isRead = readNotifs.includes(notif.id);
                                return (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        className={`flex items-start gap-3 p-3 cursor-pointer ${!isRead ? "bg-primary/5" : ""}`}
                                        onClick={() => setReadNotifs(prev => [...prev, notif.id])}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!isRead ? "bg-primary/10" : "bg-muted"}`}>
                                            <notif.icon className={`h-4 w-4 ${!isRead ? "text-primary" : "text-muted-foreground"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!isRead ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                                        </div>
                                        {!isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                                    </DropdownMenuItem>
                                );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer" onClick={() => { setNotifOpen(false); router.push(`/${locale}/dashboard`); }}>
                                View all notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu with Prototype Switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hidden md:flex">
                                <User className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>{t("profileSettings")}</DropdownMenuItem>
                            <DropdownMenuItem>{t("orderHistory")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                Prototype Menu
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleSwitch("/dashboard")}>
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                {t("smeDashboard")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSwitch("/oem-dashboard")}>
                                <Building2 className="h-4 w-4 mr-2" />
                                {t("oemDashboard")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSwitch("/brand-launchpad")}>
                                <Rocket className="h-4 w-4 mr-2" />
                                {t("brandLaunchpad")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                {t("signOut")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                            <nav className="flex flex-col gap-4 mt-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={`/${locale}${link.href}`}
                                        onClick={() => setOpen(false)}
                                        className={`text-lg font-medium transition-colors hover:text-primary py-2 ${link.active ? "text-primary" : "text-foreground"
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <Link
                                    href={`/${locale}/messages`}
                                    onClick={() => setOpen(false)}
                                    className={`text-lg font-medium transition-colors hover:text-primary py-2 flex items-center gap-2 ${normalizedPathname === "/messages" ? "text-primary" : "text-foreground"
                                        }`}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    {t("messages")}
                                </Link>
                                <hr className="my-4" />
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    Prototype Menu
                                </p>
                                <Link
                                    href={`/${locale}/dashboard`}
                                    onClick={() => setOpen(false)}
                                    className="text-lg font-medium text-foreground hover:text-primary py-2 flex items-center gap-2"
                                >
                                    <ShoppingBag className="h-5 w-5" />
                                    {t("smeDashboard")}
                                </Link>
                                <Link
                                    href={`/${locale}/oem-dashboard`}
                                    onClick={() => setOpen(false)}
                                    className="text-lg font-medium text-foreground hover:text-primary py-2 flex items-center gap-2"
                                >
                                    <Building2 className="h-5 w-5" />
                                    {t("oemDashboard")}
                                </Link>
                                <hr className="my-4" />
                                <Link
                                    href={`/${locale}/oem-onboarding`}
                                    onClick={() => setOpen(false)}
                                    className="text-lg font-medium text-foreground hover:text-primary py-2"
                                >
                                    {t("registerFactory")}
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
