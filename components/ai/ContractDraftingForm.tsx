import { useState } from "react";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ContractDraftingFormProps {
    factoryName: string;
    onGenerate: (contract: ContractData) => void;
    onClose: () => void;
}

interface ContractData {
    productType: string;
    quantity: string;
    totalPrice: string;
    deliveryDate: string;
    penaltyClause: string;
}

export function ContractDraftingForm({ factoryName, onGenerate, onClose }: ContractDraftingFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ContractData>({
        productType: "Sunscreen SPF50 Mousse",
        quantity: "1000",
        totalPrice: "120000",
        deliveryDate: "",
        penaltyClause: "0.1",
    });

    const handleSubmit = async () => {
        setLoading(true);
        // Simulate AI processing
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        onGenerate(formData);
    };

    return (
        <Card className="border-primary/30">
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Draft New Contract
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Input
                        value={formData.productType}
                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                        placeholder="e.g., Cream, Serum, Lotion"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            placeholder="1000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Total Price (฿)</Label>
                        <Input
                            type="number"
                            value={formData.totalPrice}
                            onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                            placeholder="120000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Delivery Date</Label>
                    <Input
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Penalty Clause</Label>
                    <Select
                        value={formData.penaltyClause}
                        onValueChange={(value) => setFormData({ ...formData, penaltyClause: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select penalty clause" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="0.1">0.1% per day late</SelectItem>
                            <SelectItem value="1">1% per day late</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating with AI...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Contract
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
