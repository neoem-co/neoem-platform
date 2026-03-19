import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata({
  title: "Legal Nudge",
  description: "Post-deal legal workflow and compliance guidance.",
});

export default function LegalNudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
