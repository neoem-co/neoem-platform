import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFactories } from "@/lib/factory-data";
import { createPageMetadata, getAbsoluteUrl, getLocalizedPath, isThaiLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    locale,
    pathname: "factories",
    title: isThaiLocale(locale)
      ? "ค้นหาโรงงาน OEM ที่ผ่านการตรวจสอบในประเทศไทย"
      : "Find Verified OEM Factories in Thailand",
    description: isThaiLocale(locale)
      ? "ค้นหาโรงงาน OEM ที่ผ่านการตรวจสอบ เปรียบเทียบ MOQ ความเชี่ยวชาญ ใบรับรอง และเริ่มพูดคุยกับพาร์ทเนอร์การผลิตที่เหมาะกับแบรนด์ของคุณ"
      : "Browse verified OEM factories in Thailand, compare MOQ, certifications, specialties, and shortlist the right manufacturing partner for your brand.",
    keywords: [
      "OEM factory directory Thailand",
      "manufacturer directory Thailand",
      "cosmetics factory Thailand",
      "supplement factory Thailand",
      "private label manufacturers Thailand",
    ],
  });
}

export default async function FactoriesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const factories = getFactories(locale).slice(0, 10);

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
        name: "Factories",
        item: getAbsoluteUrl(getLocalizedPath(locale, "factories")),
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Verified OEM factories",
    itemListElement: factories.map((factory, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: factory.name,
      url: getAbsoluteUrl(getLocalizedPath(locale, `factory/${factory.slug}`)),
      description: factory.description,
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />
      {children}
    </>
  );
}
