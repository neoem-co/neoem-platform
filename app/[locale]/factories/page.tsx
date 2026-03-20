"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Filter, SlidersHorizontal, X, Search, Sparkles, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { FactoryCard } from "@/components/home/FactoryCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLocale, useTranslations } from "next-intl";
import {
    getFactories,
    getFactoryCategoryId,
    getFactorySearchableText,
} from "@/lib/factory-data";

const FactoriesContent = () => {
    const t = useTranslations("Factories");
    const commonT = useTranslations("Common");
    const locale = useLocale();
    const isThai = locale.startsWith("th");
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const factories = useMemo(() => getFactories(locale), [locale]);
    const query = searchParams.get("q") || "";
    const categoryParam = searchParams.get("category") || "";
    const initialCategorySelection = useMemo(
        () => (categoryParam ? [categoryParam.toLowerCase()] : []),
        [categoryParam]
    );

    const [searchInput, setSearchInput] = useState(query);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[] | null>(null);
    const [moqRange, setMoqRange] = useState([0, 5000]);
    const [minRating, setMinRating] = useState(0);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const activeSelectedCategories = selectedCategories ?? initialCategorySelection;

    const categoryOptions = useMemo(() => {
        const labelsById = new Map<string, string>();

        factories.forEach((factory) => {
            const id = getFactoryCategoryId(factory);
            if (!labelsById.has(id)) {
                labelsById.set(id, factory.category);
            }
        });

        return Array.from(labelsById.entries()).map(([id, label]) => ({ id, label }));
    }, [factories]);

    const categoryLabels = useMemo(
        () => new Map(categoryOptions.map((category) => [category.id, category.label] as const)),
        [categoryOptions]
    );

    const locations = useMemo(
        () => Array.from(new Set(factories.map((factory) => factory.location))).sort(),
        [factories]
    );

    const certifications = useMemo(
        () => Array.from(new Set(factories.flatMap((factory) => factory.certifications || []))).sort(),
        [factories]
    );

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
        const filtered = factories.filter((factory) => {
            if (query) {
                const searchLower = query.toLowerCase();
                const matchesSearch = getFactorySearchableText(factory, locale).includes(searchLower);
                if (!matchesSearch) return false;
            }

            if (activeSelectedCategories.length > 0) {
                if (!activeSelectedCategories.includes(getFactoryCategoryId(factory))) return false;
            }

            if (selectedLocations.length > 0) {
                if (!selectedLocations.some((l) => factory.location.includes(l))) return false;
            }

            if (selectedCertifications.length > 0) {
                if (!selectedCertifications.some((c) =>
                    (factory.certifications || []).some((certification) => certification.includes(c))
                )) return false;
            }

            if (factory.moq < moqRange[0] || factory.moq > moqRange[1]) return false;
            if (factory.rating < minRating) return false;

            return true;
        });
        return filtered;
    }, [activeSelectedCategories, factories, locale, minRating, query, selectedLocations, selectedCertifications, moqRange]);

    const recommendedFactories = useMemo(
        () => filteredFactories.slice(0, 3),
        [filteredFactories]
    );

    const standardFactories = useMemo(
        () => filteredFactories.slice(3),
        [filteredFactories]
    );

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

    const toggleCategoryFilter = (value: string) => {
        if (activeSelectedCategories.includes(value)) {
            setSelectedCategories(activeSelectedCategories.filter((category) => category !== value));
        } else {
            setSelectedCategories([...activeSelectedCategories, value]);
        }
    };

    const clearFilters = () => {
        setSelectedLocations([]);
        setSelectedCertifications([]);
        setSelectedCategories([]);
        setMoqRange([0, 5000]);
        setMinRating(0);
    };

    const hasActiveFilters =
        selectedLocations.length > 0 ||
        selectedCertifications.length > 0 ||
        activeSelectedCategories.length > 0 ||
        minRating > 0 ||
        moqRange[0] > 0 ||
        moqRange[1] < 5000;

    const activeFilterCount =
        activeSelectedCategories.length +
        selectedLocations.length +
        selectedCertifications.length +
        (minRating > 0 ? 1 : 0);

    const filterContent = (
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
                    {categoryOptions.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={activeSelectedCategories.includes(category.id)}
                                onCheckedChange={() => toggleCategoryFilter(category.id)}
                            />
                            <span className="text-sm text-muted-foreground">{category.label}</span>
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

            {/* Rating */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">{t("rating")}</h4>
                <Slider
                    value={[minRating]}
                    onValueChange={(value) => setMinRating(value[0] ?? 0)}
                    min={0}
                    max={5}
                    step={0.5}
                    className="mt-4"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Star className="h-3.5 w-3.5 fill-[#FF7A00] text-[#FF7A00]" />
                        {minRating.toFixed(1)}+
                    </span>
                    <span>5.0</span>
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
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>{t("filters")}</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6">
                                    {filterContent}
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
                        {filterContent}
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
                            {activeSelectedCategories.map((cat) => (
                                <span
                                    key={cat}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                >
                                    {categoryLabels.get(cat) || cat}
                                    <button onClick={() => toggleCategoryFilter(cat)}>
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
                            {minRating > 0 && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FF7A00]/10 text-[#FF7A00] rounded-full text-sm">
                                    <Star className="h-3 w-3 fill-current" />
                                    {t("rating")} {minRating.toFixed(1)}+
                                    <button onClick={() => setMinRating(0)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
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
                        <div className="space-y-6">
                            {recommendedFactories.length > 0 && (
                                <section className="rounded-2xl border-2 border-[#FF7A00] bg-gradient-to-br from-[#FF7A00]/10 via-background to-background p-4 md:p-5">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7A00] text-white shadow-sm">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-foreground">
                                                {isThai ? "3 โรงงานที่ AI มองว่าเหมาะกับโปรไฟล์ของคุณ" : t("smartMatchTitle")}
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {isThai
                                                    ? "เราจัดกลุ่มผลลัพธ์ 3 อันดับแรกที่สอดคล้องกับความต้องการและโปรไฟล์ของคุณไว้ให้เห็นชัดก่อน"
                                                    : "The first 3 results are highlighted as AI matches from your profile."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-1">
                                        {recommendedFactories.map((factory) => (
                                            <FactoryCard
                                                key={factory.id}
                                                factory={factory}
                                                variant="horizontal"
                                                isRecommended={true}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {standardFactories.length > 0 && (
                                <section className="space-y-4">
                                    {recommendedFactories.length > 0 && (
                                        <div>
                                            <h2 className="text-lg font-semibold text-foreground">{t("otherResults")}</h2>
                                            <p className="text-sm text-muted-foreground">{t("factoriesFound", { count: standardFactories.length })}</p>
                                        </div>
                                    )}
                                    <div className="grid gap-4 md:grid-cols-1">
                                        {standardFactories.map((factory) => (
                                            <FactoryCard
                                                key={factory.id}
                                                factory={factory}
                                                variant="horizontal"
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
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
