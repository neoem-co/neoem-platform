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
    pathname: "brand-launchpad",
    title: isThaiLocale(locale) ? "Brand Launchpad สำหรับเปิดตัวแบรนด์" : "Brand Launchpad for New OEM Brands",
    description: isThaiLocale(locale)
      ? "วางแผนการจดบริษัท คอมพลายแอนซ์ FDA เครื่องหมายการค้า และบริการพาร์ทเนอร์ที่จำเป็นสำหรับการเปิดตัวแบรนด์ควบคู่ไปกับการผลิต"
      : "Plan company registration, FDA compliance, trademark work, and launch services for your new brand while production is underway.",
    keywords: [
      "brand launchpad Thailand",
      "FDA compliance Thailand",
      "trademark registration Thailand",
      "brand launch checklist",
    ],
  });
}

export default async function BrandLaunchpadLayout({
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
        name: "Brand Launchpad",
        item: getAbsoluteUrl(getLocalizedPath(locale, "brand-launchpad")),
      },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "NEOEM Brand Launchpad",
    url: getAbsoluteUrl(getLocalizedPath(locale, "brand-launchpad")),
    areaServed: "Thailand",
    description:
      "Guided launch workflow for company registration, branding, legal compliance, and go-to-market support.",
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, serviceSchema]} />
      {children}
    </>
  );
}
