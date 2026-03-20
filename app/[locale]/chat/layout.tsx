import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata({
  title: "Deal Chat",
  description: "Private chat, quotation, and negotiation workspace.",
});

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
