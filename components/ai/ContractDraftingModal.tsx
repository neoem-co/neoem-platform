import { useState } from "react";
import { FileText, Sparkles, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContractDraftingModalProps {
  open: boolean;
  onClose: () => void;
  factoryName: string;
  onGenerate: (contract: ContractData) => void;
  initialData?: ContractData | null;
}

export interface ContractData {
  template: string;
  productType: string;
  quantity: string;
  totalPrice: string;
  deliveryDate: string;
  penaltyClause: string;
  paymentTerms: string;
  qualityStandards: string;
  warrantyPeriod: string;
  additionalClauses: string;
}

const templates = [
  { id: "sales", label: "สัญญาซื้อขาย / Sales Contract" },
  { id: "hire-of-work", label: "สัญญาจ้างทำของ / Hire of Work Contract" },
  { id: "oem", label: "สัญญา OEM Manufacturing" },
  { id: "nda", label: "สัญญารักษาความลับ / NDA" },
  { id: "distribution", label: "สัญญาตัวแทนจำหน่าย / Distribution" },
];

export function ContractDraftingModal({ open, onClose, factoryName, onGenerate, initialData }: ContractDraftingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialData ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [formData, setFormData] = useState<ContractData>(initialData || {
    template: "",
    productType: "Sunscreen SPF50 Mousse",
    quantity: "1000",
    totalPrice: "120000",
    deliveryDate: "",
    penaltyClause: "0.1",
    paymentTerms: "30-40-30",
    qualityStandards: "",
    warrantyPeriod: "30",
    additionalClauses: "",
  });

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setGenerated(true);
    setStep(3);
    onGenerate(formData);
  };

  const handleClose = () => {
    if (!generated) {
      setStep(initialData ? 2 : 1);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {generated ? "Contract Generated" : initialData ? "Edit Contract" : "Draft New Contract"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                s < step ? "bg-success text-success-foreground"
                  : s === step ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>{s}</div>
              <span className={`text-xs ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s === 1 ? "Template" : s === 2 ? "Details" : "Download"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Template Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a contract template to get started:</p>
            <div className="grid gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setFormData({ ...formData, template: tpl.id })}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    formData.template === tpl.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-foreground text-sm">{tpl.label}</p>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)} disabled={!formData.template} className="w-full">
              Next: Fill Details
            </Button>
          </div>
        )}

        {/* Step 2: Fill Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-secondary/20 space-y-1 text-sm">
              <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
                {templates.find(t => t.id === formData.template)?.label || "Manufacturing Agreement"}
              </p>
              <p className="text-muted-foreground">
                Between <span className="font-medium text-foreground">Your Company</span> (Buyer)
                and <span className="font-medium text-primary">{factoryName}</span> (Manufacturer).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Product Type <span className="text-destructive">*</span></Label>
              <Input value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} placeholder="e.g., Cream, Serum, Lotion" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity <span className="text-destructive">*</span></Label>
                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Total Price (฿) <span className="text-destructive">*</span></Label>
                <Input type="number" value={formData.totalPrice} onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Delivery Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Warranty (days)</Label>
                <Input type="number" value={formData.warrantyPeriod} onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Penalty Clause</Label>
                <Select value={formData.penaltyClause} onValueChange={(v) => setFormData({ ...formData, penaltyClause: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="0.1">0.1% per day late</SelectItem>
                    <SelectItem value="1">1% per day late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30-40-30">30-40-30 Milestone</SelectItem>
                    <SelectItem value="50-50">50-50 Split</SelectItem>
                    <SelectItem value="100-upfront">100% Upfront</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quality Standards</Label>
              <Textarea value={formData.qualityStandards} onChange={(e) => setFormData({ ...formData, qualityStandards: e.target.value })} placeholder="e.g., ISO 9001, GMP certified..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Additional Clauses</Label>
              <Textarea value={formData.additionalClauses} onChange={(e) => setFormData({ ...formData, additionalClauses: e.target.value })} placeholder="Any special terms..." rows={2} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleGenerate} disabled={loading} className="flex-1">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate Contract</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Download */}
        {step === 3 && generated && (
          <div className="space-y-4 text-center py-4">
            <div className="p-6 bg-success/5 border border-success/20 rounded-xl space-y-3">
              <FileText className="h-12 w-12 text-success mx-auto" />
              <p className="font-semibold text-foreground text-lg">Contract_Draft.pdf</p>
              <p className="text-sm text-muted-foreground">Generated just now · Saved to your history</p>
            </div>
            <Button className="w-full" size="lg">
              <Download className="h-5 w-5 mr-2" /> Download Contract PDF
            </Button>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
