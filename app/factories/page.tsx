"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FactoryCard } from "@/components/home/FactoryCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import factoriesData from "@/data/factories.json";

const locations = ["Bangkok", "Samut Prakan", "Pathum Thani", "Chonburi", "Nonthaburi"];
const certifications = ["ISO 9001", "GMP", "FDA Approved", "Halal", "Organic", "OEKO-TEX"];
const categories = ["Cosmetics", "Supplements", "Packaging", "Clothing", "Skincare"];

function FactoryListContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const categoryParam = searchParams.get("category") || "";

    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        categoryParam ? [categoryParam] : []
    );
    const [moqRange, setMoqRange] = useState([0, 5000]);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const filteredFactories = useMemo(() => {
        return factoriesData.factories.filter((factory) => {
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
    }, [query, selectedCategories, selectedLocations, selectedCertifications, moqRange]);

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
                    Filters
                </h3>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                        Clear all
                    </button>
                )}
            </div>

            {/* Categories */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Category</h4>
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
                <h4 className="text-sm font-medium text-foreground">Location</h4>
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
                <h4 className="text-sm font-medium text-foreground">MOQ Range</h4>
                <Slider
                    value={moqRange}
                    onValueChange={setMoqRange}
                    min={0}
                    max={5000}
                    step={100}
                    className="mt-4"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{moqRange[0]} pcs</span>
                    <span>{moqRange[1]} pcs</span>
                </div>
            </div>

            {/* Certifications */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Certifications</h4>
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
        <div className="container py-4 md:py-6 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">
                        {query ? `Results for "${query}"` : "All Factories"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {filteredFactories.length} factories found
                    </p>
                </div>

                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild className="lg:hidden">
                        <Button variant="outline" size="sm">
                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                            Filters
                            {hasActiveFilters && (
                                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                    {selectedCategories.length + selectedLocations.length + selectedCertifications.length}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                            <FilterContent />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex gap-6">
                {/* Desktop Sidebar Filters */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="bg-card border rounded-lg p-4 sticky top-20">
                        <FilterContent />
                    </div>
                </aside>

                {/* Factory List */}
                <main className="flex-1 space-y-4">
                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap">
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
                            <p className="text-muted-foreground">No factories found matching your criteria.</p>
                            <Button variant="link" onClick={clearFilters} className="mt-2">
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-1">
                            {filteredFactories.map((factory) => (
                                <FactoryCard key={factory.id} factory={factory} variant="horizontal" />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function FactoryList() {
    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />
            <Suspense fallback={<div className="container py-10">Loading factories...</div>}>
                <FactoryListContent />
            </Suspense>
            <Footer />
        </div>
    );
}
