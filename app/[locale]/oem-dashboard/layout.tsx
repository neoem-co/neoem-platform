import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata({
  title: "OEM Dashboard",
  description: "Factory-side dashboard with analytics and quotation tools.",
});

export default function OemDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
