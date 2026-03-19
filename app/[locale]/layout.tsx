import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { GlobalFloatingChat } from "@/components/chat/GlobalFloatingChat";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  getLocaleCountryCode,
  getSiteUrl,
  isThaiLocale,
} from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const description = isThaiLocale(locale)
    ? "ค้นหาโรงงาน OEM ที่ผ่านการตรวจสอบในประเทศไทย เปรียบเทียบพาร์ทเนอร์การผลิต และเปิดตัวแบรนด์ของคุณด้วยเครื่องมือด้านกฎหมายและคอมพลายแอนซ์ในแพลตฟอร์มเดียว"
    : SITE_DESCRIPTION;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    keywords: [
      "OEM Thailand",
      "Thailand manufacturers",
      "private label manufacturing",
      "cosmetics OEM Thailand",
      "supplement manufacturer Thailand",
      "factory sourcing platform",
    ],
    category: "manufacturing",
    alternates: {
      languages: {
        en: "/en",
        th: "/th",
        "x-default": "/th",
      },
    },
    openGraph: {
      siteName: SITE_NAME,
      locale: getLocaleCountryCode(locale),
      type: "website",
      title: SITE_NAME,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} platform preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    icons: {
      icon: "/assets/logo.png",
      shortcut: "/assets/logo.png",
      apple: "/assets/logo.png",
    },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Explicitly set the request locale for next-intl
  setRequestLocale(locale);

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <GlobalFloatingChat />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
