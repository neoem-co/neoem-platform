import type { Metadata } from "next";

export const SITE_NAME = "NEOEM";
export const SITE_DESCRIPTION =
  "Find verified OEM factories in Thailand, compare manufacturing partners, and launch your brand with built-in legal and compliance support.";
export const DEFAULT_OG_IMAGE = "/assets/factory-hero.jpg";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    "http://localhost:3000";

  return configuredUrl.replace(/\/+$/, "");
}

export function getLocalizedPath(locale: string, pathname = "") {
  const cleanPathname = pathname ? pathname.replace(/^\/+/, "") : "";
  return cleanPathname ? `/${locale}/${cleanPathname}` : `/${locale}`;
}

export function getAbsoluteUrl(pathname = "") {
  if (/^https?:\/\//.test(pathname)) {
    return pathname;
  }

  const normalizedPath = pathname ? (pathname.startsWith("/") ? pathname : `/${pathname}`) : "";
  return `${getSiteUrl()}${normalizedPath}`;
}

export function buildLanguageAlternates(pathname = "") {
  return {
    en: getLocalizedPath("en", pathname),
    th: getLocalizedPath("th", pathname),
    "x-default": getLocalizedPath("th", pathname),
  };
}

export function isThaiLocale(locale: string) {
  return locale.toLowerCase().startsWith("th");
}

export function getLocaleCountryCode(locale: string) {
  return isThaiLocale(locale) ? "th_TH" : "en_US";
}

export function getLocaleName(locale: string) {
  return isThaiLocale(locale) ? "Thai" : "English";
}

type PageMetadataInput = {
  locale: string;
  title: string;
  description: string;
  pathname?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  locale,
  title,
  description,
  pathname = "",
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const localizedPath = getLocalizedPath(locale, pathname);
  const localeCode = getLocaleCountryCode(locale);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: localizedPath,
      languages: buildLanguageAlternates(pathname),
    },
    openGraph: {
      title,
      description,
      url: localizedPath,
      siteName: SITE_NAME,
      locale: localeCode,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

type NoIndexMetadataInput = {
  title: string;
  description: string;
};

export function createNoIndexMetadata({
  title,
  description,
}: NoIndexMetadataInput): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}
