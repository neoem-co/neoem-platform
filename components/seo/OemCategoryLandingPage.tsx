import Link from "next/link";
import { ChevronRight, CheckCircle2, Factory, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FactoryCard } from "@/components/home/FactoryCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FactoryRecord } from "@/lib/factory-data";
import { getAbsoluteUrl, getLocalizedPath } from "@/lib/seo";

type HighlightIcon = typeof Factory | typeof ShieldCheck | typeof FileText;

export type OemCategoryLandingCopy = {
  badge: string;
  title: string;
  description: string;
  intro: string;
  highlights: Array<{ title: string; description: string; icon: HighlightIcon }>;
  sectionTitle: string;
  sectionDescription: string;
  checklistTitle: string;
  checklist: string[];
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

type OemCategoryLandingPageProps = {
  locale: string;
  pathname: string;
  copy: OemCategoryLandingCopy;
  factories: FactoryRecord[];
};

export function OemCategoryLandingPage({
  locale,
  pathname,
  copy,
  factories,
}: OemCategoryLandingPageProps) {
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
        item: getAbsoluteUrl(getLocalizedPath(locale, pathname)),
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
    name: copy.title,
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
                  {copy.badge}
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
                    <Link href={`/${locale}/find-oem-factory`}>
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

              <div className="grid gap-3 mt-8 md:grid-cols-2">
                {copy.checklist.map((item) => (
                  <div key={item} className="rounded-2xl border bg-background px-5 py-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14">
            <div className="container">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-foreground">{copy.checklistTitle}</h2>
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
                    <Link href={`/${locale}/find-oem-factory`}>{copy.ctaSecondary}</Link>
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
