import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CheckCircle2, Factory, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FactoryCard } from "@/components/home/FactoryCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFactories, isThaiLocale } from "@/lib/factory-data";
import { createPageMetadata, getAbsoluteUrl, getLocalizedPath } from "@/lib/seo";

type LocalePageCopy = {
  title: string;
  description: string;
  intro: string;
  highlights: Array<{ title: string; description: string; icon: typeof Factory }>;
  sectionTitle: string;
  sectionDescription: string;
  categoryTitle: string;
  categoryDescription: string;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

function getPageCopy(locale: string): LocalePageCopy {
  if (isThaiLocale(locale)) {
    return {
      title: "หาโรงงาน OEM ที่ผ่านการตรวจสอบในไทย",
      description:
        "คู่มือสำหรับผู้ประกอบการและเจ้าของแบรนด์ที่ต้องการหาโรงงาน OEM ในไทย เปรียบเทียบโรงงาน ดู MOQ ความเชี่ยวชาญ ใบรับรอง และเริ่มต้นผลิตกับพาร์ทเนอร์ที่เหมาะสม",
      intro:
        "ถ้าคุณกำลังหาโรงงาน OEM สำหรับสกินแคร์ เครื่องสำอาง อาหารเสริม หรือสินค้าอื่น ๆ ในไทย หน้านี้จะช่วยให้คุณเริ่มได้เร็วขึ้นด้วยรายชื่อโรงงานที่ผ่านการตรวจสอบและแนวทางคัดเลือกแบบเป็นขั้นตอน",
      highlights: [
        {
          title: "ดูโรงงานที่ผ่านการตรวจสอบ",
          description: "คัดกรองโปรไฟล์โรงงานจากข้อมูลสำคัญ เช่น ประเภทสินค้า ความเชี่ยวชาญ และใบรับรอง",
          icon: ShieldCheck,
        },
        {
          title: "เทียบ MOQ และความเหมาะสม",
          description: "ดูขั้นต่ำการผลิต ความเชี่ยวชาญของโรงงาน และเลือกพาร์ทเนอร์ที่เหมาะกับแบรนด์ของคุณ",
          icon: Factory,
        },
        {
          title: "เริ่มต้นพร้อมเอกสารและกฎหมาย",
          description: "ใช้ NEOEM ต่อไปยังการคุยงาน ร่างสัญญา และงานคอมพลายแอนซ์ได้ในแพลตฟอร์มเดียว",
          icon: FileText,
        },
      ],
      sectionTitle: "วิธีหาโรงงาน OEM ให้เหมาะกับแบรนด์ของคุณ",
      sectionDescription:
        "เริ่มจากประเภทสินค้า งบประมาณ MOQ และเมืองหรือภูมิภาคที่คุณต้องการ จากนั้นจึงเทียบโปรไฟล์โรงงานและพูดคุยกับโรงงานที่เข้ากับแผนการผลิตจริงของคุณ",
      categoryTitle: "หมวดโรงงาน OEM ที่คนค้นหาบ่อย",
      categoryDescription:
        "เริ่มจากหมวดที่ใกล้เคียงกับสินค้าของคุณมากที่สุด แล้วค่อยคัดกรองต่อจาก MOQ สถานที่ตั้ง และใบรับรอง",
      faqTitle: "คำถามที่พบบ่อยเกี่ยวกับการหาโรงงาน OEM",
      faqs: [
        {
          question: "หาโรงงาน OEM ในไทยควรดูอะไรบ้าง?",
          answer:
            "ควรดูประเภทสินค้า MOQ ใบรับรอง ความเชี่ยวชาญ ประวัติการส่งมอบ และรายละเอียดด้านกฎหมายหรือสัญญาก่อนตัดสินใจ",
        },
        {
          question: "โรงงาน OEM แบบไหนเหมาะกับแบรนด์เริ่มต้น?",
          answer:
            "แบรนด์เริ่มต้นควรหาโรงงานที่มี MOQ ไม่สูงเกินไป สื่อสารชัดเจน และมีประสบการณ์กับหมวดสินค้าที่คุณกำลังจะผลิต",
        },
        {
          question: "ทำไมควรใช้ NEOEM เพื่อหาโรงงาน OEM?",
          answer:
            "NEOEM รวมการค้นหาโรงงานที่ผ่านการตรวจสอบ การเปรียบเทียบข้อมูลสำคัญ และเครื่องมือด้านสัญญาหรือคอมพลายแอนซ์ไว้ในจุดเดียว",
        },
      ],
      ctaTitle: "พร้อมเริ่มหาโรงงาน OEM แล้วหรือยัง?",
      ctaDescription:
        "เปิดรายชื่อโรงงานทั้งหมด เปรียบเทียบรายละเอียด และเริ่มคุยกับโรงงานที่เหมาะกับสินค้าของคุณได้ทันที",
      ctaPrimary: "ดูรายชื่อโรงงานทั้งหมด",
      ctaSecondary: "กลับหน้าแรก NEOEM",
    };
  }

  return {
    title: "How to Find Verified OEM Factories in Thailand",
    description:
      "A practical guide for founders and brands looking for OEM factories in Thailand. Compare manufacturers by MOQ, specialties, certifications, and fit before starting production.",
    intro:
      "If you are looking for an OEM factory for skincare, cosmetics, supplements, packaging, or other categories in Thailand, this page helps you start with verified factory profiles and a clearer selection process.",
    highlights: [
      {
        title: "Browse verified OEM factories",
        description: "Review factory profiles with product categories, specialties, and trust signals before requesting a quote.",
        icon: ShieldCheck,
      },
      {
        title: "Compare MOQ and manufacturing fit",
        description: "Shortlist factories based on your product, budget, and production requirements.",
        icon: Factory,
      },
      {
        title: "Move forward with legal support",
        description: "Continue from discovery into contracts, negotiation, and compliance workflows inside NEOEM.",
        icon: FileText,
      },
    ],
    sectionTitle: "How to choose the right OEM factory",
    sectionDescription:
      "Start with product category, budget, MOQ, and preferred location. Then compare factory profiles and contact the manufacturers that best match your production plan.",
    categoryTitle: "Popular OEM factory categories",
    categoryDescription:
      "Start with the category closest to your product, then filter further by MOQ, location, ratings, and certifications.",
    faqTitle: "Common questions about finding OEM factories",
    faqs: [
      {
        question: "What should I compare when choosing an OEM factory?",
        answer:
          "Look at product category fit, MOQ, certifications, specialization, delivery record, and contract clarity before deciding.",
      },
      {
        question: "What kind of OEM factory is best for a new brand?",
        answer:
          "New brands usually need factories with manageable MOQ, clear communication, and experience in the same product category.",
      },
      {
        question: "Why use NEOEM to find OEM factories?",
        answer:
          "NEOEM combines verified factory discovery, trust signals, and legal/compliance tools so brands can source with more confidence.",
      },
    ],
    ctaTitle: "Ready to find an OEM factory?",
    ctaDescription:
      "Browse all factories, compare manufacturing details, and start conversations with partners that fit your product.",
    ctaPrimary: "Browse all factories",
    ctaSecondary: "Back to NEOEM home",
  };
}

const categoryLinks = [
  { href: "/oem-cosmetics-factory", labelEn: "Cosmetics OEM", labelTh: "โรงงาน OEM เครื่องสำอาง" },
  { href: "/oem-cosmetics-factory", labelEn: "Skincare OEM", labelTh: "โรงงาน OEM สกินแคร์" },
  { href: "/oem-supplement-factory", labelEn: "Supplement OEM", labelTh: "โรงงาน OEM อาหารเสริม" },
  { href: "/factories?category=packaging", labelEn: "Packaging OEM", labelTh: "โรงงาน OEM บรรจุภัณฑ์" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getPageCopy(locale);

  return createPageMetadata({
    locale,
    pathname: "find-oem-factory",
    title: copy.title,
    description: copy.description,
    keywords: isThaiLocale(locale)
      ? [
          "หาโรงงาน OEM",
          "หาโรงงาน OEM ในไทย",
          "โรงงาน OEM",
          "โรงงาน OEM เครื่องสำอาง",
          "โรงงาน OEM อาหารเสริม",
          "NEOEM",
        ]
      : [
          "find OEM factory Thailand",
          "OEM factory Thailand",
          "cosmetics OEM Thailand",
          "supplement manufacturer Thailand",
          "NEOEM",
        ],
  });
}

export default async function FindOemFactoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = getPageCopy(locale);
  const factories = getFactories(locale).slice(0, 4);
  const isThai = isThaiLocale(locale);

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
        name: copy.title,
        item: getAbsoluteUrl(getLocalizedPath(locale, "find-oem-factory")),
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.categoryTitle,
    itemListElement: factories.map((factory, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: factory.name,
      url: getAbsoluteUrl(getLocalizedPath(locale, `factory/${factory.slug}`)),
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, itemListSchema]} />

      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1">
          <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 via-background to-background">
            <div className="container">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-medium mb-5">
                  <Sparkles className="h-4 w-4" />
                  {isThai ? "คู่มือหาโรงงาน OEM" : "OEM factory guide"}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  {copy.title}
                </h1>
                <p className="mt-5 text-lg text-muted-foreground max-w-3xl">
                  {copy.description}
                </p>
                <p className="mt-4 text-base text-muted-foreground max-w-3xl">
                  {copy.intro}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href={`/${locale}/factories`}>
                      {copy.ctaPrimary}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href={`/${locale}`}>
                      {copy.ctaSecondary}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="py-14">
            <div className="container">
              <div className="grid gap-4 md:grid-cols-3">
                {copy.highlights.map((highlight) => (
                  <Card key={highlight.title} className="bg-card/80">
                    <CardContent className="p-6">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <highlight.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">{highlight.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{highlight.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14 bg-secondary/20">
            <div className="container">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-foreground">{copy.sectionTitle}</h2>
                <p className="mt-3 text-muted-foreground">{copy.sectionDescription}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-8">
                {categoryLinks.map((category) => (
                  <Link
                    key={`${category.href}-${category.labelEn}`}
                    href={`/${locale}${category.href}`}
                    className="rounded-2xl border bg-background p-5 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {isThai ? category.labelTh : category.labelEn}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {isThai ? "ดูรายชื่อโรงงานและเริ่มเปรียบเทียบ" : "Browse factories and compare options"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14">
            <div className="container">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-foreground">{copy.categoryTitle}</h2>
                <p className="mt-3 text-muted-foreground">{copy.categoryDescription}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
                {factories.map((factory) => (
                  <FactoryCard key={factory.id} factory={factory} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-14 bg-secondary/20">
            <div className="container">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-foreground">{copy.faqTitle}</h2>
              </div>

              <div className="grid gap-4 mt-8">
                {copy.faqs.map((faq) => (
                  <Card key={faq.question}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground">{faq.question}</h3>
                          <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container">
              <div className="max-w-3xl rounded-3xl border bg-card p-8 md:p-12">
                <h2 className="text-3xl font-bold text-foreground">{copy.ctaTitle}</h2>
                <p className="mt-3 text-muted-foreground">{copy.ctaDescription}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href={`/${locale}/factories`}>{copy.ctaPrimary}</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href={`/${locale}`}>{copy.ctaSecondary}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
