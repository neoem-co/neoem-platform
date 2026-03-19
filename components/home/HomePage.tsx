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
import { Rocket, ChevronRight, CheckCircle2, Palette, Shield, Scale, BookOpenText, FileSearch, BadgeCheck, MessagesSquare } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function HomePage() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const topFactories = getFactories(locale).slice(0, 4);
  const isThai = locale.toLowerCase().startsWith("th");
  const categoryQuickLinks = [
    {
      href: `/${locale}/oem-cosmetics-factory`,
      label: isThai ? "โรงงาน OEM เครื่องสำอาง" : "Cosmetics OEM",
    },
    {
      href: `/${locale}/oem-skincare-factory`,
      label: isThai ? "โรงงาน OEM สกินแคร์" : "Skincare OEM",
    },
    {
      href: `/${locale}/oem-supplement-factory`,
      label: isThai ? "โรงงาน OEM อาหารเสริม" : "Supplement OEM",
    },
  ];
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

      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_28%)]" />
        <div className="container">
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
            <article className="rounded-[28px] border bg-card/90 shadow-[0_18px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="p-6 md:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    <BookOpenText className="h-4 w-4" />
                    SEO Article
                  </div>
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    NEOEM Guide
                  </div>
                </div>

                <div className="mt-6 max-w-3xl">
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">
                    {t("seoContent.title")}
                  </h2>
                  <p className="mt-4 text-base md:text-lg leading-8 text-muted-foreground">
                    {t("seoContent.description")}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: BadgeCheck,
                      title: t("seoContent.highlights.verifiedTitle"),
                      desc: t("seoContent.highlights.verifiedDesc"),
                    },
                    {
                      icon: FileSearch,
                      title: t("seoContent.highlights.matchTitle"),
                      desc: t("seoContent.highlights.matchDesc"),
                    },
                    {
                      icon: MessagesSquare,
                      title: t("seoContent.highlights.launchTitle"),
                      desc: t("seoContent.highlights.launchDesc"),
                    },
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border bg-background/85 p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          0{index + 1}
                        </div>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_320px]">
                  <div className="rounded-[24px] border bg-gradient-to-br from-primary/10 via-background to-background px-6 py-6 md:px-7">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                      {isThai ? "Editor’s Note" : "Editor’s Note"}
                    </div>
                    <blockquote className="mt-4 border-l-4 border-primary pl-5 text-lg md:text-xl font-medium leading-8 text-foreground">
                      “{t("seoContent.editorialQuote")}”
                    </blockquote>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {isThai
                        ? "บทความส่วนนี้ถูกจัดวางเพื่อช่วยให้คุณเริ่มจากคำถามพื้นฐานที่ถูกต้อง และไปต่อยังหน้าค้นหาโรงงานที่ตรงหมวดได้เร็วขึ้น"
                        : "This section is structured to help you start with the right questions and move faster into the most relevant factory category pages."}
                    </p>
                  </div>

                  <Card className="rounded-[24px] border bg-background/90">
                    <CardContent className="p-6">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {t("seoContent.takeawaysTitle")}
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          t("seoContent.takeaways.one"),
                          t("seoContent.takeaways.two"),
                          t("seoContent.takeaways.three"),
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={`/${locale}/find-oem-factory`}>
                    <Button className="gap-2">
                      {t("seoContent.guideCta")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {isThai
                      ? "เริ่มจากคู่มือหลัก แล้วค่อยลงลึกตามหมวดสินค้า"
                      : "Start with the main guide, then go deeper by category."}
                  </p>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              <Card className="overflow-hidden rounded-[28px] border bg-gradient-to-br from-primary/10 via-background to-background shadow-[0_18px_70px_-35px_rgba(15,23,42,0.35)]">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/80">
                    {isThai ? "หมวดที่คนค้นหาบ่อย" : "Popular Queries"}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-foreground">
                    {isThai ? "เริ่มจากหมวดโรงงาน OEM ที่ใช่" : "Jump into the right OEM category"}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {isThai
                      ? "เลือกหมวดที่ใกล้กับสินค้าของคุณที่สุด เพื่อเริ่มจากผลลัพธ์ที่ตรงความต้องการมากกว่า"
                      : "Choose the category closest to your product so your search starts with more relevant factory options."}
                  </p>

                  <div className="mt-5 space-y-2">
                    {categoryQuickLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group flex items-center justify-between rounded-2xl border bg-background/90 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border bg-card/95 shadow-[0_18px_70px_-35px_rgba(15,23,42,0.35)]">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {isThai ? "บทสรุปสั้น ๆ" : "At a Glance"}
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      isThai ? "ดูโรงงานที่ผ่านการตรวจสอบก่อน" : "Start with verified factories",
                      isThai ? "เทียบ MOQ และหมวดสินค้าให้ชัด" : "Compare MOQ and category fit",
                      isThai ? "ค่อยต่อยอดสู่การคุยงานและเอกสาร" : "Move into outreach and documents next",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
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
          <div className="rounded-[30px] border bg-card/90 p-6 md:p-8 lg:p-10 shadow-[0_18px_70px_-35px_rgba(15,23,42,0.35)]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <MessagesSquare className="h-4 w-4" />
                Q&A
              </div>
              <h2 className="mt-5 text-3xl md:text-4xl font-bold text-foreground">
                {t("seoContent.faqTitle")}
              </h2>
              <p className="mt-3 text-muted-foreground leading-7">
                {isThai
                  ? "คำตอบสั้น กระชับ และตรงประเด็นสำหรับคนที่กำลังหาโรงงาน OEM และอยากเริ่มจากข้อมูลที่อ่านง่าย"
                  : "Short, direct answers for teams researching OEM factories and wanting clearer starting points."}
              </p>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="rounded-[24px] border bg-background/80">
                <CardContent className="p-2 md:p-4">
                  <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                    {seoFaqs.map((faq, index) => (
                      <AccordionItem key={faq.question} value={`item-${index}`} className="border-b last:border-b-0">
                        <AccordionTrigger className="px-4 text-left text-base font-semibold text-foreground hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-5 text-sm leading-7 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border bg-primary/[0.07]">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/80">
                    {isThai ? "อ่านต่อ" : "Next Read"}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-foreground">
                    {isThai ? "คู่มือและหน้าหมวดที่ควรเปิดต่อ" : "Guides and category pages to open next"}
                  </h3>
                  <div className="mt-5 space-y-3">
                    <Link href={`/${locale}/find-oem-factory`} className="block rounded-2xl border bg-background/90 px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors">
                      {t("seoContent.guideCta")}
                    </Link>
                    {categoryQuickLinks.map((link) => (
                      <Link
                        key={`faq-${link.href}`}
                        href={link.href}
                        className="block rounded-2xl border bg-background/90 px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
