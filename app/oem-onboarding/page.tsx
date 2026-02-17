"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Wrench, Image, ChevronRight, ChevronLeft, Check, Upload, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = ["Skincare", "Cosmetics", "Supplements", "Food & Beverage", "Clothing", "Packaging"];
const moqRanges = ["100-500", "500-1000", "1000-5000", "5000+"];

const steps = [
    { id: 1, label: "Basic Info", icon: Building2 },
    { id: 2, label: "Capabilities", icon: Wrench },
    { id: 3, label: "Media", icon: Image },
];

export default function OEMOnboarding() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        factoryName: "",
        taxId: "",
        location: "",
        categories: [] as string[],
        moqRange: "",
        logo: null as File | null,
        coverImage: null as File | null,
        photos: [] as File[],
    });

    const handleCategoryToggle = (category: string) => {
        if (formData.categories.includes(category)) {
            setFormData({
                ...formData,
                categories: formData.categories.filter((c) => c !== category),
            });
        } else {
            setFormData({
                ...formData,
                categories: [...formData.categories, category],
            });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setLoading(false);
        router.push("/oem-dashboard");
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.factoryName && formData.taxId && formData.location;
            case 2:
                return formData.categories.length > 0 && formData.moqRange;
            case 3:
                return true;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            <div className="container py-8 md:py-12 max-w-2xl flex-1">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= step.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground"
                                        }`}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <step.icon className="h-5 w-5" />
                                    )}
                                </div>
                                <span
                                    className={`ml-2 text-sm hidden sm:inline ${currentStep >= step.id ? "text-foreground font-medium" : "text-muted-foreground"
                                        }`}
                                >
                                    {step.label}
                                </span>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-12 sm:w-24 h-0.5 mx-2 sm:mx-4 ${currentStep > step.id ? "bg-primary" : "bg-border"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {currentStep === 1 && "Basic Information"}
                            {currentStep === 2 && "Factory Capabilities"}
                            {currentStep === 3 && "Media & Photos"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {currentStep === 1 && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="factory-name">Factory Name *</Label>
                                    <Input
                                        id="factory-name"
                                        placeholder="Enter your factory name"
                                        value={formData.factoryName}
                                        onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax-id">Tax ID (13 digits) *</Label>
                                    <Input
                                        id="tax-id"
                                        placeholder="Enter your tax ID"
                                        value={formData.taxId}
                                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                        maxLength={13}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <Select
                                        value={formData.location}
                                        onValueChange={(value) => setFormData({ ...formData, location: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bangkok">Bangkok</SelectItem>
                                            <SelectItem value="Samut Prakan">Samut Prakan</SelectItem>
                                            <SelectItem value="Pathum Thani">Pathum Thani</SelectItem>
                                            <SelectItem value="Chonburi">Chonburi</SelectItem>
                                            <SelectItem value="Nonthaburi">Nonthaburi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                <div className="space-y-3">
                                    <Label>Categories *</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {categories.map((category) => (
                                            <label
                                                key={category}
                                                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                                            >
                                                <Checkbox
                                                    checked={formData.categories.includes(category)}
                                                    onCheckedChange={() => handleCategoryToggle(category)}
                                                />
                                                <span className="text-sm text-foreground">{category}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>MOQ Range *</Label>
                                    <Select
                                        value={formData.moqRange}
                                        onValueChange={(value) => setFormData({ ...formData, moqRange: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select MOQ range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {moqRanges.map((range) => (
                                                <SelectItem key={range} value={range}>
                                                    {range} pieces
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                <div className="space-y-3">
                                    <Label>Factory Logo</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <label className="cursor-pointer block">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                    setFormData({ ...formData, logo: e.target.files?.[0] || null })
                                                }
                                            />
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                {formData.logo ? formData.logo.name : "Click to upload logo"}
                                            </p>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Cover Image</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <label className="cursor-pointer block">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                    setFormData({ ...formData, coverImage: e.target.files?.[0] || null })
                                                }
                                            />
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                {formData.coverImage ? formData.coverImage.name : "Click to upload cover image"}
                                            </p>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Factory Photos (max 5 for Starter plan)</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <label className="cursor-pointer block">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        photos: Array.from(e.target.files || []).slice(0, 5),
                                                    })
                                                }
                                            />
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                {formData.photos.length > 0
                                                    ? `${formData.photos.length} files selected`
                                                    : "Click to upload photos"}
                                            </p>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-4 border-t">
                            {currentStep > 1 ? (
                                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 3 ? (
                                <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating Profile...
                                        </>
                                    ) : (
                                        <>
                                            Complete Setup
                                            <Check className="h-4 w-4 ml-1" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
}
