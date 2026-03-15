import { useState } from "react";
import { MessageSquare, ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ChatSelectorPopupProps {
    open: boolean;
    onClose: () => void;
    onSelect: (slug: string) => void;
}

const mockDeals = [
    { slug: "thai-cosmetics-pro", factory: "Thai Cosmetics Pro", product: "Sunscreen SPF50", status: "In Progress" },
    { slug: "pure-skin-lab", factory: "Pure Skin Lab", product: "Anti-Aging Serum", status: "Negotiation" },
    { slug: "siam-herbal-extract", factory: "Siam Herbal Extract", product: "Turmeric Supplements", status: "Completed" },
];

export function ChatSelectorPopup({ open, onClose, onSelect }: ChatSelectorPopupProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Select a Deal
                    </DialogTitle>
                    <DialogDescription>
                        Which chat/deal would you like to use as context?
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    {mockDeals.map((deal) => (
                        <button
                            key={deal.slug}
                            onClick={() => onSelect(deal.slug)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">{deal.factory.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{deal.factory}</p>
                                    <p className="text-xs text-muted-foreground">{deal.product} · {deal.status}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
