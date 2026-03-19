"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSearch } from "@/components/home/HeroSearch";
import { FactoryCard } from "@/components/home/FactoryCard";
import { TrustBanners } from "@/components/home/TrustBanners";
import { FeatureShowcase } from "@/components/home/FeatureShowcase";
import { DotMatrixBackground } from "@/components/home/DotMatrixBackground";
import { getFactories } from "@/lib/factory-data";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Rocket, ChevronRight, CheckCircle2, Palette, Shield, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function HomePage() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const topFactories = getFactories(locale).slice(0, 4);
  const seoFaqs = [
    {
      question: t("seoContent.faq.q1"),
      answer: t("seoContent.faq.a1"),
    },
    {
      question: t("seoContent.faq.q2"),
      answer: t("seoContent.faq.a2"),
    },
    {
      question: t("seoContent.faq.q3"),
      answer: t("seoContent.faq.a3"),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="relative py-20 overflow-hidden" style={{ pointerEvents: "auto" }}>
        <DotMatrixBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background pointer-events-none" />
        <div className="container relative z-10">
          <HeroSearch />
        </div>
      </section>

      <FeatureShowcase />

      <section className="py-14 bg-card/40 border-y">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("seoContent.title")}
            </h2>
            <p className="mt-3 text-muted-foreground text-base md:text-lg">
              {t("seoContent.description")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-8">
            <Card className="bg-background/80">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground">
                  {t("seoContent.highlights.verifiedTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("seoContent.highlights.verifiedDesc")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/80">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground">
                  {t("seoContent.highlights.matchTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("seoContent.highlights.matchDesc")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/80">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground">
                  {t("seoContent.highlights.launchTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("seoContent.highlights.launchDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <TrustBanners />

      <section className="py-16 bg-secondary/20">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t("verifiedPicks")}</h2>
              <p className="text-muted-foreground mt-1">{t("verifiedPicksDesc")}</p>
            </div>
            <Link href={`/${locale}/factories`} className="text-sm font-medium text-primary hover:underline">
              {t("viewAll")} →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topFactories.map((factory) => (
              <FactoryCard key={factory.id} factory={factory} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Rocket className="h-4 w-4" />
                {t("launchpadTitle")}
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">{t("launchpadHeading")}</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("launchpadDesc")}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: CheckCircle2, title: t("launchpadItems.registration"), desc: t("launchpadItems.registrationDesc") },
                { icon: Palette, title: t("launchpadItems.brandDesign"), desc: t("launchpadItems.brandDesignDesc") },
                { icon: Shield, title: t("launchpadItems.compliance"), desc: t("launchpadItems.complianceDesc") },
                { icon: Scale, title: t("launchpadItems.marketplace"), desc: t("launchpadItems.marketplaceDesc") },
              ].map((item) => (
                <Card key={item.title} className="bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link href={`/${locale}/brand-launchpad`}>
                <Button size="lg" className="gap-2">
                  <Rocket className="h-5 w-5" />
                  {t("exploreLaunchpad")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground mt-1">{t("stats.factories")}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">98%</div>
              <div className="text-muted-foreground mt-1">{t("stats.onTime")}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">10K+</div>
              <div className="text-muted-foreground mt-1">{t("stats.launched")}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground mt-1">{t("stats.support")}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 flex-1">
        <div className="container">
          <div className="bg-card border rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">{t("ctaTitle")}</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{t("ctaDesc")}</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href={`/${locale}/factories`} className="inline-flex items-center justify-center h-12 px-8 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                {t("ctaFind")}
              </Link>
              <Link href={`/${locale}/pricing`} className="inline-flex items-center justify-center h-12 px-8 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
                {t("ctaList")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/20">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("seoContent.faqTitle")}
            </h2>
          </div>

          <div className="grid gap-4 mt-8">
            {seoFaqs.map((faq) => (
              <Card key={faq.question} className="bg-background/90">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground">{faq.question}</h3>
                  <p className="text-muted-foreground mt-2">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
