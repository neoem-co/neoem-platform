import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFactories, getFactoryBySlug } from "@/lib/factory-data";
import {
  createNoIndexMetadata,
  createPageMetadata,
  getAbsoluteUrl,
  getLocalizedPath,
  isThaiLocale,
} from "@/lib/seo";

function getLocality(location: string) {
  return location.split(",")[0]?.trim() || location;
}

export function generateStaticParams() {
  return ["en", "th"].flatMap((locale) =>
    getFactories("en").map((factory) => ({
      locale,
      slug: factory.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const factory = getFactoryBySlug(slug, locale);

  if (!factory) {
    return createNoIndexMetadata({
      title: "Factory Not Found",
      description: "The requested factory profile does not exist.",
    });
  }

  const certifications = factory.certifications.slice(0, 3).join(", ");
  const baseDescription = isThaiLocale(locale)
    ? `${factory.name} เป็นโรงงาน ${factory.category} ที่ผ่านการตรวจสอบใน ${factory.location} พร้อมข้อมูล MOQ ความเชี่ยวชาญ ใบรับรอง และตัวชี้วัดความน่าเชื่อถือเพื่อช่วยคัดเลือกพาร์ทเนอร์การผลิต`
    : `${factory.name} is a verified ${factory.category.toLowerCase()} OEM factory in ${factory.location}. Review MOQ, specialties, certifications, and trust signals before you request a quote.`;

  return createPageMetadata({
    locale,
    pathname: `factory/${slug}`,
    title: `${factory.name} OEM Factory Profile`,
    description: certifications ? `${baseDescription} Certifications: ${certifications}.` : baseDescription,
    keywords: [
      factory.name,
      `${factory.category} manufacturer Thailand`,
      `${factory.category} OEM Thailand`,
      ...factory.specialties,
      ...factory.certifications,
    ],
  });
}

export default async function FactoryDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const factory = getFactoryBySlug(slug, locale);

  if (!factory) {
    return children;
  }

  const factoryUrl = getAbsoluteUrl(getLocalizedPath(locale, `factory/${slug}`));

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
      {
        "@type": "ListItem",
        position: 3,
        name: factory.name,
        item: factoryUrl,
      },
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: factory.name,
    url: factoryUrl,
    description: factory.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: getLocality(factory.location),
      addressCountry: "TH",
    },
    areaServed: "Thailand",
    knowsAbout: factory.specialties,
    award: factory.certifications,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: factory.rating,
      reviewCount: factory.reviewCount,
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, organizationSchema]} />
      {children}
    </>
  );
}
