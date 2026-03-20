import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getAbsoluteUrl, getLocalizedPath, isThaiLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    locale,
    pathname: "pricing",
    title: isThaiLocale(locale) ? "แพ็กเกจสำหรับโรงงาน OEM" : "Pricing Plans for OEM Factories",
    description: isThaiLocale(locale)
      ? "ดูแพ็กเกจสมาชิกสำหรับโรงงาน OEM บน NEOEM พร้อมสิทธิ์การมองเห็น โปรไฟล์ที่น่าเชื่อถือ และเครื่องมือ AI สำหรับการเติบโต"
      : "Compare NEOEM pricing plans for OEM factories, including visibility, trust-building features, and AI tools to grow your factory profile.",
    keywords: [
      "OEM platform pricing",
      "factory directory pricing",
      "manufacturer listing plans",
      "OEM factory membership Thailand",
    ],
  });
}

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: getAbsoluteUrl(getLocalizedPath(locale)),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: getAbsoluteUrl(getLocalizedPath(locale, "pricing")),
      },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: isThaiLocale(locale) ? "แพ็กเกจสำหรับโรงงาน OEM" : "Pricing Plans for OEM Factories",
    url: getAbsoluteUrl(getLocalizedPath(locale, "pricing")),
    description: "Pricing and membership plans for factories listing on NEOEM.",
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, webPageSchema]} />
      {children}
    </>
  );
}
