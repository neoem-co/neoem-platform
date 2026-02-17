"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, User, Menu, ChevronDown, Building2, ShoppingBag, Rocket, MessageSquare } from "lucide-react";
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

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const navLinks = [
        { href: "/factories", label: "Find Factories", active: pathname === "/factories" },
        { href: "/brand-launchpad", label: "Brand Launchpad", active: pathname === "/brand-launchpad" },
        { href: "/messages", label: "Messages", active: pathname === "/messages", icon: MessageSquare },
        { href: "/dashboard", label: "Dashboard", active: pathname === "/dashboard" },
        { href: "/pricing", label: "For Factories", active: pathname === "/pricing" },
    ];

    const handleSwitch = (path: string) => {
        router.push(path);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 md:h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/assets/neoem-logo.png" alt="NEOEM" className="h-8 md:h-10 w-auto" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors hover:text-primary ${link.active ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 md:gap-4">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                            3
                        </span>
                    </Button>

                    {/* User Menu with Prototype Switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hidden md:flex">
                                <User className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                            <DropdownMenuItem>Order History</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                Prototype Menu
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleSwitch("/dashboard")}>
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Switch to SME Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSwitch("/oem-dashboard")}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Switch to OEM Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSwitch("/brand-launchpad")}>
                                <Rocket className="h-4 w-4 mr-2" />
                                Brand Launchpad
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                Sign Out
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
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={`text-lg font-medium transition-colors hover:text-primary py-2 ${link.active ? "text-primary" : "text-foreground"
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <hr className="my-4" />
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                    Prototype Menu
                                </p>
                                <Link
                                    href="/dashboard"
                                    onClick={() => setOpen(false)}
                                    className="text-lg font-medium text-foreground hover:text-primary py-2 flex items-center gap-2"
                                >
                                    <ShoppingBag className="h-5 w-5" />
                                    SME Dashboard
                                </Link>
                                <Link
                                    href="/oem-dashboard"
                                    onClick={() => setOpen(false)}
                                    className="text-lg font-medium text-foreground hover:text-primary py-2 flex items-center gap-2"
                                >
                                    <Building2 className="h-5 w-5" />
                                    OEM Dashboard
                                </Link>
                                <Link
                                    href="/brand-launchpad"
                                    onClick={() => setOpen(false)}
                                    className="text-lg font-medium text-foreground hover:text-primary py-2 flex items-center gap-2"
                                >
                                    <Rocket className="h-5 w-5" />
                                    Brand Launchpad
                                </Link>
                                <hr className="my-4" />
                                <Link
                                    href="/oem-onboarding"
                                    onClick={() => setOpen(false)}
                                    className="text-lg font-medium text-foreground hover:text-primary py-2"
                                >
                                    Register Your Factory
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
