"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Building2, Image, ChevronRight, ChevronLeft, Check, Upload, Loader2, Shield, FileCheck, Search, CreditCard } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = ["Skincare", "Cosmetics", "Supplements", "Food & Beverage", "Clothing", "Packaging"];
const moqRanges = ["100-500", "500-1000", "1000-5000", "5000+"];
const basicInfoDemoData = {
    factoryName: "Thai Cosmetics Pro Co., Ltd.",
    taxId: "0105558099991",
    location: "Samut Prakan",
    categories: ["Cosmetics", "Skincare"],
    moqRange: "1000-5000",
};

const steps = [
    { id: 1, label: "Basic Info", icon: Building2 },
    { id: 2, label: "Verification", icon: Shield },
    { id: 3, label: "KYB", icon: CreditCard, optional: true },
    { id: 4, label: "Licenses", icon: FileCheck, optional: true },
    { id: 5, label: "Media", icon: Image },
];

const OEMOnboarding = () => {
    const router = useRouter();
    const locale = useLocale();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [dbdChecking, setDbdChecking] = useState(false);
    const [dbdStatus, setDbdStatus] = useState<"idle" | "active" | "inactive">("idle");
    const [objectiveChecking, setObjectiveChecking] = useState(false);
    const [objectiveStatus, setObjectiveStatus] = useState<"idle" | "manufacturer" | "non-manufacturer">("idle");

    const [formData, setFormData] = useState({
        factoryName: "",
        taxId: "",
        location: "",
        categories: [] as string[],
        moqRange: "",
        directorName: "",
        nationalId: "",
        hasFactoryLicense: false,
        hasFDA: false,
        factoryLicenseFile: null as File | null,
        fdaFile: null as File | null,
        logo: null as File | null,
        coverImage: null as File | null,
        photos: [] as File[],
    });

    const handleCategoryToggle = (category: string) => {
        if (formData.categories.includes(category)) {
            setFormData({ ...formData, categories: formData.categories.filter((c) => c !== category) });
        } else {
            setFormData({ ...formData, categories: [...formData.categories, category] });
        }
    };

    const applyBasicInfoDemoData = () => {
        setFormData((prev) => ({
            ...prev,
            factoryName: basicInfoDemoData.factoryName,
            taxId: basicInfoDemoData.taxId,
            location: basicInfoDemoData.location,
            categories: [...basicInfoDemoData.categories],
            moqRange: basicInfoDemoData.moqRange,
        }));
    };

    const handleDBDCheck = async () => {
        setDbdChecking(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setDbdChecking(false);
        setDbdStatus("active");
    };

    const handleObjectiveCheck = async () => {
        setObjectiveChecking(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setObjectiveChecking(false);
        setObjectiveStatus("manufacturer");
    };

    const handleSubmit = async () => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setLoading(false);
        router.push(`/${locale}/oem-dashboard`);
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return formData.factoryName && formData.taxId && formData.location;
            case 2: return dbdStatus === "active" && objectiveStatus === "manufacturer";
            case 3: return true; // Optional — can skip
            case 4: return true; // Optional — can skip
            case 5: return true;
            default: return false;
        }
    };

    return (
        <div className="min-h-screen bg-secondary/20 flex flex-col">
            <Navbar />

            <div className="container py-8 md:py-12 max-w-2xl flex-1">
                {/* Progress Steps - Fixed alignment */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${currentStep >= step.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary text-muted-foreground"
                                            }`}
                                    >
                                        {currentStep > step.id ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                    </div>
                                    <span className={`mt-2 text-xs text-center hidden sm:block ${currentStep >= step.id ? "text-foreground font-medium" : "text-muted-foreground"
                                        }`}>
                                        {step.label}
                                    </span>
                                    {step.optional && (
                                        <span className="text-[10px] text-muted-foreground hidden sm:block">(Optional)</span>
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-3 ${currentStep > step.id ? "bg-primary" : "bg-border"
                                        }`} />
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
                            {currentStep === 2 && "Business Verification (DBD)"}
                            {currentStep === 3 && (
                                <div className="flex items-center gap-2">
                                    KYB — Director Verification
                                    <Badge variant="outline" className="text-xs">Optional</Badge>
                                </div>
                            )}
                            {currentStep === 4 && (
                                <div className="flex items-center gap-2">
                                    License & Certification
                                    <Badge variant="outline" className="text-xs">Optional</Badge>
                                </div>
                            )}
                            {currentStep === 5 && "Media & Photos"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <>
                                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Demo shortcut</p>
                                        <p className="text-xs text-muted-foreground">Fill only the Basic Info step with mock onboarding data for a faster demo.</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={applyBasicInfoDemoData}>
                                        Use Demo Data
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factory-name">Factory Name <span className="text-destructive">*</span></Label>
                                    <Input id="factory-name" placeholder="Enter your factory name" value={formData.factoryName} onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax-id">Tax ID (13 digits) <span className="text-destructive">*</span></Label>
                                    <Input id="tax-id" placeholder="Enter your tax ID" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} maxLength={13} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                                    <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                                        <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bangkok">Bangkok</SelectItem>
                                            <SelectItem value="Samut Prakan">Samut Prakan</SelectItem>
                                            <SelectItem value="Pathum Thani">Pathum Thani</SelectItem>
                                            <SelectItem value="Chonburi">Chonburi</SelectItem>
                                            <SelectItem value="Nonthaburi">Nonthaburi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label>Categories <span className="text-destructive">*</span></Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {categories.map((category) => (
                                            <label key={category} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                                                <Checkbox checked={formData.categories.includes(category)} onCheckedChange={() => handleCategoryToggle(category)} />
                                                <span className="text-sm text-foreground">{category}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>MOQ Range <span className="text-destructive">*</span></Label>
                                    <Select value={formData.moqRange} onValueChange={(value) => setFormData({ ...formData, moqRange: value })}>
                                        <SelectTrigger><SelectValue placeholder="Select MOQ range" /></SelectTrigger>
                                        <SelectContent>
                                            {moqRanges.map((range) => (<SelectItem key={range} value={range}>{range} pieces</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {/* Step 2: DBD Verification */}
                        {currentStep === 2 && (
                            <>
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="text-sm text-foreground font-medium mb-1">Automated Business Verification</p>
                                    <p className="text-xs text-muted-foreground">We verify your company status with DBD DataWarehouse+ to ensure trust and compliance.</p>
                                </div>

                                <div className={`p-4 rounded-lg border-2 ${dbdStatus === "active" ? "border-success bg-success/5" : "border-muted"}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Search className="h-4 w-4 text-primary" />
                                            <span className="font-medium text-foreground text-sm">Step 1: Corporate Status (DBD)</span>
                                        </div>
                                        {dbdStatus === "active" && <Badge variant="outline" className="text-success border-success">✓ Active</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">ตรวจสอบสถานะนิติบุคคล — Must be &quot;ยังดำเนินกิจการอยู่&quot;</p>
                                    {dbdStatus === "idle" && (
                                        <Button onClick={handleDBDCheck} disabled={dbdChecking} size="sm" className="w-full">
                                            {dbdChecking ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking DBD API...</>) : "Verify Corporate Status"}
                                        </Button>
                                    )}
                                    {dbdStatus === "active" && (
                                        <div className="p-3 bg-success/10 rounded-lg text-sm text-foreground">
                                            <p className="font-medium">✓ Status: ยังดำเนินกิจการอยู่ (Active)</p>
                                            <p className="text-xs text-muted-foreground mt-1">Registered: {formData.factoryName || "Thai Cosmetics Pro Co., Ltd."}</p>
                                        </div>
                                    )}
                                </div>

                                <div className={`p-4 rounded-lg border-2 ${objectiveStatus === "manufacturer" ? "border-success bg-success/5" : "border-muted"}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-primary" />
                                            <span className="font-medium text-foreground text-sm">Step 2: Business Objective</span>
                                        </div>
                                        {objectiveStatus === "manufacturer" && <Badge variant="outline" className="text-success border-success">✓ Manufacturer</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">ตรวจสอบวัตถุประสงค์ — Must be registered as &quot;ผู้ผลิต&quot; (Manufacturer)</p>
                                    {objectiveStatus === "idle" && (
                                        <Button onClick={handleObjectiveCheck} disabled={objectiveChecking || dbdStatus !== "active"} size="sm" variant="outline" className="w-full">
                                            {objectiveChecking ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking Objective...</>) : "Verify Business Objective"}
                                        </Button>
                                    )}
                                    {objectiveStatus === "manufacturer" && (
                                        <div className="p-3 bg-success/10 rounded-lg text-sm text-foreground">
                                            <p className="font-medium">✓ Objective: ผลิตเครื่องสำอาง (Cosmetics Manufacturer)</p>
                                            <p className="text-xs text-muted-foreground mt-1">Verified — not a middleman or reseller</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Step 3: KYB (Optional) */}
                        {currentStep === 3 && (
                            <>
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="text-sm text-foreground font-medium mb-1">Know Your Business (KYB)</p>
                                    <p className="text-xs text-muted-foreground">
                                        Optional: Verify the authorized director&apos;s identity. Complete this to earn a <strong>Verified Badge</strong>.
                                    </p>
                                </div>
                                <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                        ⭐ You can skip this step now and complete it later from your Dashboard to earn the Verified Badge.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="directorName">Authorized Director Name</Label>
                                    <Input id="directorName" placeholder="Full name as on National ID" value={formData.directorName} onChange={(e) => setFormData({ ...formData, directorName: e.target.value })} />
                                    <p className="text-xs text-muted-foreground">ชื่อ-นามสกุล กรรมการผู้มีอำนาจ</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nationalId">Thai National ID Number</Label>
                                    <Input id="nationalId" placeholder="X-XXXX-XXXXX-XX-X" value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} maxLength={17} />
                                    <p className="text-xs text-muted-foreground">เลขบัตรประจำตัวประชาชน 13 หลัก</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Upload National ID Card</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" className="hidden" />
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">Upload front of Thai National ID</p>
                                            <p className="text-xs text-muted-foreground mt-1">Image will be verified against name</p>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 4: Licenses (Optional) */}
                        {currentStep === 4 && (
                            <>
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="text-sm text-foreground font-medium mb-1">License Cross-Check</p>
                                    <p className="text-xs text-muted-foreground">
                                        Optional: Cross-reference with Department of Industrial Works and FDA. Completing this earns a <strong>Verified Badge</strong>.
                                    </p>
                                </div>
                                <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                        ⭐ You can skip this step now and complete it later from your Dashboard to earn the Verified Badge.
                                    </p>
                                </div>
                                <div className={`p-4 rounded-lg border-2 ${formData.hasFactoryLicense ? "border-success bg-success/5" : "border-muted"}`}>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <Checkbox checked={formData.hasFactoryLicense} onCheckedChange={(checked) => setFormData({ ...formData, hasFactoryLicense: !!checked })} className="mt-1" />
                                        <div>
                                            <p className="font-medium text-foreground">Factory License (ร.ง.4)</p>
                                            <p className="text-xs text-muted-foreground">ใบอนุญาตประกอบกิจการโรงงาน — Department of Industrial Works</p>
                                        </div>
                                    </label>
                                    {formData.hasFactoryLicense && (
                                        <div className="mt-3 ml-7">
                                            <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                                <label className="cursor-pointer block">
                                                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setFormData({ ...formData, factoryLicenseFile: e.target.files?.[0] || null })} />
                                                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                                    <p className="text-xs text-muted-foreground">{formData.factoryLicenseFile ? formData.factoryLicenseFile.name : "Upload ร.ง.4 document"}</p>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`p-4 rounded-lg border-2 ${formData.hasFDA ? "border-success bg-success/5" : "border-muted"}`}>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <Checkbox checked={formData.hasFDA} onCheckedChange={(checked) => setFormData({ ...formData, hasFDA: !!checked })} className="mt-1" />
                                        <div>
                                            <p className="font-medium text-foreground">FDA License (อย.)</p>
                                            <p className="text-xs text-muted-foreground">ใบอนุญาตสถานที่ผลิต — Thai FDA</p>
                                        </div>
                                    </label>
                                    {formData.hasFDA && (
                                        <div className="mt-3 ml-7">
                                            <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                                <label className="cursor-pointer block">
                                                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setFormData({ ...formData, fdaFile: e.target.files?.[0] || null })} />
                                                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                                    <p className="text-xs text-muted-foreground">{formData.fdaFile ? formData.fdaFile.name : "Upload อย. document"}</p>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Step 5: Media */}
                        {currentStep === 5 && (
                            <>
                                <div className="space-y-3">
                                    <Label>Factory Logo</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })} />
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{formData.logo ? formData.logo.name : "Click to upload logo"}</p>
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label>Cover Image</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFormData({ ...formData, coverImage: e.target.files?.[0] || null })} />
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{formData.coverImage ? formData.coverImage.name : "Click to upload cover image"}</p>
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label>Factory Photos (max 5 for Starter plan)</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <label className="cursor-pointer block">
                                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFormData({ ...formData, photos: Array.from(e.target.files || []).slice(0, 5) })} />
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{formData.photos.length > 0 ? `${formData.photos.length} files selected` : "Click to upload photos"}</p>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-4 border-t">
                            {currentStep > 1 ? (
                                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />Back
                                </Button>
                            ) : <div />}

                            <div className="flex gap-2">
                                {/* Skip button for optional steps */}
                                {(currentStep === 3 || currentStep === 4) && (
                                    <Button variant="ghost" onClick={() => setCurrentStep(currentStep + 1)}>
                                        Skip for now
                                    </Button>
                                )}

                                {currentStep < 5 ? (
                                    <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
                                        Next<ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Profile...</>) : (<>Complete Setup<Check className="h-4 w-4 ml-1" /></>)}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
};

export default OEMOnboarding;
