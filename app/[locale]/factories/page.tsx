"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Filter, SlidersHorizontal, X, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { FactoryCard } from "@/components/home/FactoryCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import factoriesData from "@/data/factories.json";
import { useTranslations } from "next-intl";

const locations = ["Bangkok", "Samut Prakan", "Pathum Thani", "Chonburi", "Nonthaburi"];
const certifications = ["ISO 9001", "GMP", "FDA Approved", "Halal", "Organic", "OEKO-TEX"];
const categories = ["Cosmetics", "Supplements", "Packaging", "Clothing", "Skincare"];

const FactoriesContent = () => {
    const t = useTranslations("Factories");
    const commonT = useTranslations("Common");
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const query = searchParams.get("q") || "";
    const categoryParam = searchParams.get("category") || "";

    const [searchInput, setSearchInput] = useState(query);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        categoryParam ? [categoryParam] : []
    );
    const [moqRange, setMoqRange] = useState([0, 5000]);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    // Fetch semantic search recommendations
    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!query) {
                setRecommendedIds([]);
                return;
            }

            setIsLoadingAI(true);
            try {
                const res = await fetch(`/api/ai/search/semantic?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    const ids = data.recommended.map((r: any) => r.id);
                    setRecommendedIds(ids);
                }
            } catch (error) {
                console.error("Failed to fetch semantic search results:", error);
                setRecommendedIds([]);
            } finally {
                setIsLoadingAI(false);
            }
        };

        fetchRecommendations();
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) {
            params.set("q", searchInput);
        } else {
            params.delete("q");
        }
        router.push(pathname + "?" + params.toString());
    };

    const filteredFactories = useMemo(() => {
        const filtered = factoriesData.factories.filter((factory) => {
            if (query) {
                const searchLower = query.toLowerCase();
                const matchesSearch =
                    factory.name.toLowerCase().includes(searchLower) ||
                    factory.description.toLowerCase().includes(searchLower) ||
                    factory.specialties.some((s) => s.toLowerCase().includes(searchLower)) ||
                    factory.category.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            if (selectedCategories.length > 0) {
                if (!selectedCategories.some((c) =>
                    factory.category.toLowerCase() === c.toLowerCase()
                )) return false;
            }

            if (selectedLocations.length > 0) {
                if (!selectedLocations.some((l) => factory.location.includes(l))) return false;
            }

            if (selectedCertifications.length > 0) {
                if (!selectedCertifications.some((c) =>
                    factory.tags.some((t) => t.includes(c))
                )) return false;
            }

            if (factory.moq < moqRange[0] || factory.moq > moqRange[1]) return false;

            return true;
        });

        // Sort: Recommended first
        return [...filtered].sort((a, b) => {
            const aRec = recommendedIds.includes(a.id);
            const bRec = recommendedIds.includes(b.id);
            if (aRec && !bRec) return -1;
            if (!aRec && bRec) return 1;
            return 0;
        });
    }, [query, selectedCategories, selectedLocations, selectedCertifications, moqRange, recommendedIds]);

    const toggleFilter = (
        value: string,
        selected: string[],
        setSelected: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (selected.includes(value)) {
            setSelected(selected.filter((v) => v !== value));
        } else {
            setSelected([...selected, value]);
        }
    };

    const clearFilters = () => {
        setSelectedLocations([]);
        setSelectedCertifications([]);
        setSelectedCategories([]);
        setMoqRange([0, 5000]);
    };

    const hasActiveFilters =
        selectedLocations.length > 0 ||
        selectedCertifications.length > 0 ||
        selectedCategories.length > 0 ||
        moqRange[0] > 0 ||
        moqRange[1] < 5000;

    // Filter Panel Content (shared between desktop sidebar and mobile sheet)
    const FilterContent = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {t("filters")}
                </h3>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                        {t("clearAll")}
                    </button>
                )}
            </div>

            {/* Categories */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">{t("category")}</h4>
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={selectedCategories.includes(cat.toLowerCase())}
                                onCheckedChange={() =>
                                    toggleFilter(cat.toLowerCase(), selectedCategories, setSelectedCategories)
                                }
                            />
                            <span className="text-sm text-muted-foreground">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">{t("location")}</h4>
                <div className="space-y-2">
                    {locations.map((loc) => (
                        <label key={loc} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={selectedLocations.includes(loc)}
                                onCheckedChange={() =>
                                    toggleFilter(loc, selectedLocations, setSelectedLocations)
                                }
                            />
                            <span className="text-sm text-muted-foreground">{loc}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* MOQ Range */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">{t("moqRange")}</h4>
                <Slider
                    value={moqRange}
                    onValueChange={setMoqRange}
                    min={0}
                    max={5000}
                    step={100}
                    className="mt-4"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{moqRange[0]} {t("pcs")}</span>
                    <span>{moqRange[1]} {t("pcs")}</span>
                </div>
            </div>

            {/* Certifications */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">{t("certifications")}</h4>
                <div className="space-y-2">
                    {certifications.map((cert) => (
                        <label key={cert} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={selectedCertifications.includes(cert)}
                                onCheckedChange={() =>
                                    toggleFilter(cert, selectedCertifications, setSelectedCertifications)
                                }
                            />
                            <span className="text-sm text-muted-foreground">{cert}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-secondary/20">
            <Navbar />

            {/* Sticky Search Bar */}
            <div className="sticky top-14 md:top-16 z-40 bg-background border-b shadow-sm">
                <div className="container py-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-card border rounded-lg px-3">
                            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t("searchPlaceholder")}
                                className="flex-1 h-10 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                            />
                        </div>
                        <Button type="submit" size="sm">{commonT("search")}</Button>
                        {/* Mobile Filter Button */}
                        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                            <SheetTrigger asChild className="lg:hidden">
                                <Button variant="outline" size="sm">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    {hasActiveFilters && (
                                        <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                            {selectedCategories.length + selectedLocations.length + selectedCertifications.length}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>{t("filters")}</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6">
                                    <FilterContent />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </form>
                </div>
            </div>

            <div className="container flex-1 flex gap-6 py-4 md:py-6 min-h-0">
                {/* Header + info */}
                <div className="hidden lg:block w-64 flex-shrink-0 overflow-y-auto scrollbar-thin">
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-foreground">
                            {query ? t("resultsFor", { query }) : t("allFactories")}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t("factoriesFound", { count: filteredFactories.length })}
                        </p>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <FilterContent />
                    </div>
                </div>

                {/* Factory List - Independent Scroll */}
                <main className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                    {/* Mobile header */}
                    <div className="lg:hidden mb-4">
                        <h1 className="text-xl font-bold text-foreground">
                            {query ? t("resultsFor", { query }) : t("allFactories")}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t("factoriesFound", { count: filteredFactories.length })}
                        </p>
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                            {selectedCategories.map((cat) => (
                                <span
                                    key={cat}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                >
                                    {cat}
                                    <button onClick={() => toggleFilter(cat, selectedCategories, setSelectedCategories)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            {selectedLocations.map((loc) => (
                                <span
                                    key={loc}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                                >
                                    {loc}
                                    <button onClick={() => toggleFilter(loc, selectedLocations, setSelectedLocations)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {filteredFactories.length === 0 ? (
                        <div className="bg-card border rounded-lg p-8 md:p-12 text-center">
                            <p className="text-muted-foreground">{t("noMatches")}</p>
                            <Button variant="link" onClick={clearFilters} className="mt-2">
                                {t("clearAll")}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-1">
                            {filteredFactories.map((factory) => (
                                <FactoryCard
                                    key={factory.id}
                                    factory={factory}
                                    variant="horizontal"
                                    isRecommended={recommendedIds.includes(factory.id)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default function FactoryList() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-secondary/20">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20" />
                    <div className="h-4 w-32 bg-primary/10 rounded" />
                </div>
            </div>
        }>
            <FactoriesContent />
        </Suspense>
    );
}
