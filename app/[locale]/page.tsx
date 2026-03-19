import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFactories } from "@/lib/factory-data";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  createPageMetadata,
  getAbsoluteUrl,
  getLocalizedPath,
  isThaiLocale,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    locale,
    pathname: "",
    title: isThaiLocale(locale)
      ? "ค้นหาโรงงาน OEM ที่ผ่านการตรวจสอบในไทย"
      : "Verified OEM Factories in Thailand",
    description: isThaiLocale(locale)
      ? "ค้นหา เปรียบเทียบ และเริ่มต้นทำงานกับโรงงาน OEM ที่ผ่านการตรวจสอบในไทย พร้อมเครื่องมือด้านกฎหมาย คอมพลายแอนซ์ และการเปิดตัวแบรนด์ในแพลตฟอร์มเดียว"
      : SITE_DESCRIPTION,
    keywords: [
      "OEM factories Thailand",
      "verified manufacturers Thailand",
      "cosmetics OEM Thailand",
      "private label Thailand",
      "manufacturer sourcing platform",
    ],
  });
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const featuredFactories = getFactories(locale).slice(0, 4);
  const homePath = getLocalizedPath(locale);
  const factoriesPath = getLocalizedPath(locale, "factories");

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getAbsoluteUrl(homePath),
    logo: getAbsoluteUrl("/assets/neoem-logo.png"),
    description: SITE_DESCRIPTION,
    areaServed: "Thailand",
    knowsAbout: [
      "OEM manufacturing",
      "Private label manufacturing",
      "Factory sourcing",
      "Manufacturing compliance",
      "Contract drafting",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getAbsoluteUrl(homePath),
    inLanguage: isThaiLocale(locale) ? "th" : "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${getAbsoluteUrl(factoriesPath)}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured factories",
    itemListElement: featuredFactories.map((factory, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: factory.name,
      url: getAbsoluteUrl(getLocalizedPath(locale, `factory/${factory.slug}`)),
    })),
  };

  return (
    <>
      <JsonLd data={[organizationSchema, websiteSchema, itemListSchema]} />
      <HomePage />
    </>
  );
}
