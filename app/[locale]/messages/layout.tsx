import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata({
  title: "Messages",
  description: "Private conversations and deal updates.",
});

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
