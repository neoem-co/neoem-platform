"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, CreditCard, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/payment/PaymentModal";

interface Message {
    id: string;
    sender: "user" | "other";
    text: string;
    time: string;
    fileName?: string;
}

interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    messages: Message[];
}

const initialConversations: Conversation[] = [
    {
        id: "1",
        name: "International Laboratories Corp. Ltd. (ILC)",
        lastMessage: "We'll start production next week.",
        time: "2m ago",
        unread: 2,
        messages: [
            { id: "m1", sender: "other", text: "Hello! How can I help you with your order?", time: "10:00" },
            { id: "m2", sender: "user", text: "I'd like to discuss the sunscreen formulation.", time: "10:01" },
            { id: "m3", sender: "other", text: "We'll start production next week.", time: "10:03" },
        ],
    },
    {
        id: "2",
        name: "Milott Laboratories Co., Ltd.",
        lastMessage: "Please confirm the order quantity.",
        time: "1h ago",
        unread: 1,
        messages: [
            { id: "m4", sender: "other", text: "Please confirm the order quantity.", time: "09:30" },
        ],
    },
    {
        id: "3",
        name: "S & J International Enterprises PCL",
        lastMessage: "Shipment confirmed. Tracking sent.",
        time: "Yesterday",
        unread: 0,
        messages: [
            { id: "m5", sender: "other", text: "Shipment confirmed. Tracking sent.", time: "Yesterday" },
        ],
    },
];

export function GlobalFloatingChat() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [showPayment, setShowPayment] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hide on deal room pages
    if (pathname.includes("/chat/")) return null;

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);
    const activeConv = conversations.find((c) => c.id === activeChat);

    const handleSend = () => {
        if (!inputValue.trim() || !activeChat) return;
        const newMsg: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeChat
                    ? { ...c, messages: [...c.messages, newMsg], lastMessage: inputValue, time: "Just now" }
                    : c
            )
        );
        setInputValue("");

        // Mock reply
        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                sender: "other",
                text: "Thanks for your message! We'll get back to you shortly.",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeChat
                        ? { ...c, messages: [...c.messages, reply], lastMessage: reply.text, time: "Just now" }
                        : c
                )
            );
        }, 1500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !activeChat) return;
        const file = e.target.files[0];
        const fileMsg: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: `📎 ${file.name}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fileName: file.name,
        };
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeChat
                    ? { ...c, messages: [...c.messages, fileMsg], lastMessage: `📎 ${file.name}`, time: "Just now" }
                    : c
            )
        );
    };

    return (
        <>
            {/* FAB */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
                >
                    <MessageSquare className="h-6 w-6" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                            {totalUnread}
                        </span>
                    )}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-[90] w-[360px] h-[500px] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="h-12 border-b bg-card px-4 flex items-center justify-between flex-shrink-0">
                        {activeChat ? (
                            <button onClick={() => setActiveChat(null)} className="text-sm font-medium text-foreground flex items-center gap-1">
                                ← {activeConv?.name}
                            </button>
                        ) : (
                            <span className="text-sm font-semibold text-foreground">All Conversations</span>
                        )}
                        <div className="flex items-center gap-1">
                            {activeChat && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    onClick={() => setShowPayment(true)}
                                >
                                    <CreditCard className="h-3.5 w-3.5" /> Payment
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIsOpen(false); setActiveChat(null); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    {!activeChat ? (
                        <div className="flex-1 overflow-y-auto">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveChat(conv.id)}
                                    className="w-full p-3 border-b hover:bg-secondary/50 transition-colors flex items-center gap-3 text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-primary">{conv.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-foreground truncate">{conv.name}</p>
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0">{conv.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                                    </div>
                                    {conv.unread > 0 && (
                                        <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                                            {conv.unread}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-secondary/10">
                                {activeConv?.messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] rounded-xl p-2.5 text-sm ${msg.sender === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card border text-foreground"
                                            }`}>
                                            {msg.text}
                                            <p className={`text-[10px] mt-0.5 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                                {msg.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="p-2 border-t bg-card flex items-center gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 h-9 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2"
                                />
                                <Button size="icon" className="h-8 w-8" disabled={!inputValue.trim()} onClick={handleSend}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Payment Modal */}
            <PaymentModal
                open={showPayment}
                onClose={() => setShowPayment(false)}
                onSuccess={() => setShowPayment(false)}
                amount={36000}
                factoryName={activeConv?.name || "Factory"}
            />
        </>
    );
}
