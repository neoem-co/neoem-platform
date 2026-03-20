import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFactories } from "@/lib/factory-data";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
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
  const isThai = isThaiLocale(locale);

  return {
    title: {
      absolute: isThai
        ? "NEOEM | หาโรงงาน OEM ที่ผ่านการตรวจสอบในไทย"
        : "NEOEM | Find Verified OEM Factories in Thailand",
    },
    description: isThai
      ? "NEOEM ช่วยคุณหาโรงงาน OEM ที่ผ่านการตรวจสอบในไทย เปรียบเทียบโรงงาน ความเชี่ยวชาญ MOQ และเริ่มต้นผลิตได้เร็วขึ้นอย่างมั่นใจ"
      : SITE_DESCRIPTION,
    keywords: [
      "NEOEM",
      "neoem",
      "หาโรงงาน OEM",
      "โรงงาน OEM",
      "หาโรงงาน OEM ในไทย",
      "OEM factories Thailand",
      "verified manufacturers Thailand",
      "cosmetics OEM Thailand",
      "private label Thailand",
      "manufacturer sourcing platform",
    ],
    alternates: {
      canonical: getLocalizedPath(locale),
      languages: {
        en: "/en",
        th: "/th",
        "x-default": "/th",
      },
    },
    openGraph: {
      title: isThai
        ? "NEOEM | หาโรงงาน OEM ที่ผ่านการตรวจสอบในไทย"
        : "NEOEM | Find Verified OEM Factories in Thailand",
      description: isThai
        ? "หาโรงงาน OEM ในไทยกับ NEOEM เปรียบเทียบผู้ผลิตที่ผ่านการตรวจสอบและเริ่มต้นผลิตอย่างมั่นใจ"
        : SITE_DESCRIPTION,
      url: getLocalizedPath(locale),
      siteName: SITE_NAME,
      type: "website",
      locale: isThai ? "th_TH" : "en_US",
      images: ["/assets/factory-hero.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: isThai
        ? "NEOEM | หาโรงงาน OEM ที่ผ่านการตรวจสอบในไทย"
        : "NEOEM | Find Verified OEM Factories in Thailand",
      description: isThai
        ? "หาโรงงาน OEM ในไทยกับ NEOEM เปรียบเทียบผู้ผลิตที่ผ่านการตรวจสอบและเริ่มต้นผลิตอย่างมั่นใจ"
        : SITE_DESCRIPTION,
      images: ["/assets/factory-hero.jpg"],
    },
  };
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
  const isThai = isThaiLocale(locale);
  const faqEntries = [
    {
      question: isThai
        ? "NEOEM ช่วยหาโรงงาน OEM ได้อย่างไร?"
        : "How does NEOEM help me find an OEM factory?",
      answer: isThai
        ? "NEOEM ช่วยค้นหาและเปรียบเทียบโรงงาน OEM ที่ผ่านการตรวจสอบ ดูความเชี่ยวชาญ MOQ ใบรับรอง และเริ่มต้นคุยกับโรงงานที่เหมาะกับสินค้าและงบประมาณของคุณ"
        : "NEOEM helps brands search verified factory profiles, compare specialties, MOQ, certifications, and start conversations with suitable manufacturers.",
    },
    {
      question: isThai
        ? "สามารถค้นหาโรงงาน OEM ในไทยตามประเภทสินค้าได้ไหม?"
        : "Can I search OEM factories in Thailand by product category?",
      answer: isThai
        ? "ได้ คุณสามารถค้นหาโรงงานสำหรับเครื่องสำอาง สกินแคร์ อาหารเสริม บรรจุภัณฑ์ เสื้อผ้า และหมวดการผลิตอื่น ๆ ได้"
        : "Yes. You can explore factories for cosmetics, skincare, supplements, packaging, clothing, food, and other manufacturing categories.",
    },
    {
      question: isThai
        ? "ทำไมควรใช้ NEOEM แทนการหาโรงงานเอง?"
        : "Why use NEOEM instead of searching factories manually?",
      answer: isThai
        ? "เพราะ NEOEM รวมการค้นหาโรงงาน การตรวจสอบความน่าเชื่อถือ เวิร์กโฟลว์ใบเสนอราคา และเครื่องมือด้านกฎหมายไว้ในที่เดียว"
        : "NEOEM combines factory discovery, trust verification, quotation workflows, and legal tools in one place so brands can move faster with less sourcing risk.",
    },
  ];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ["neoem", "NEOEM platform"],
    url: getAbsoluteUrl(homePath),
    logo: getAbsoluteUrl("/assets/neoem-logo.png"),
    description: isThai
      ? "แพลตฟอร์มสำหรับหาโรงงาน OEM ที่ผ่านการตรวจสอบในประเทศไทย"
      : SITE_DESCRIPTION,
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
    alternateName: ["neoem", "NEOEM platform"],
    url: getAbsoluteUrl(homePath),
    inLanguage: isThai ? "th" : "en",
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={[organizationSchema, websiteSchema, itemListSchema, faqSchema]} />
      <HomePage />
    </>
  );
}
