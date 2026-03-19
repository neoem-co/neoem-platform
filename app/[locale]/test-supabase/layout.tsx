import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata({
  title: "Supabase Test",
  description: "Internal testing route.",
});

export default function TestSupabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
