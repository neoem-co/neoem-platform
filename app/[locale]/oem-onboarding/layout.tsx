import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata({
  title: "OEM Onboarding",
  description: "Factory onboarding workflow for NEOEM.",
});

export default function OemOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
