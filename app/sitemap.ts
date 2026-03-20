import type { MetadataRoute } from "next";
import { getFactories } from "@/lib/factory-data";
import { getAbsoluteUrl, getLocalizedPath } from "@/lib/seo";

export const revalidate = 86400;

const publicRouteSuffixes = ["", "factories", "pricing", "brand-launchpad", "find-oem-factory"];
const locales = ["en", "th"] as const;
type SitemapEntry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicRoutes: SitemapEntry[] = locales.flatMap((locale) =>
    publicRouteSuffixes.map((suffix): SitemapEntry => {
      const pathname = getLocalizedPath(locale, suffix);
      const localizedAlternates = Object.fromEntries(
        locales.map((alternateLocale) => [
          alternateLocale,
          getAbsoluteUrl(getLocalizedPath(alternateLocale, suffix)),
        ])
      );
      const changeFrequency: SitemapEntry["changeFrequency"] =
        suffix === "" ? "weekly" : "daily";

      return {
        url: getAbsoluteUrl(pathname),
        lastModified: now,
        changeFrequency,
        priority: suffix === "" ? 1 : 0.8,
        alternates: {
          languages: localizedAlternates,
        },
      };
    })
  );

  const englishFactories = getFactories("en");

  const factoryRoutes: SitemapEntry[] = locales.flatMap((locale) =>
    englishFactories.map((factory): SitemapEntry => {
      const pathname = getLocalizedPath(locale, `factory/${factory.slug}`);
      const localizedAlternates = Object.fromEntries(
        locales.map((alternateLocale) => [
          alternateLocale,
          getAbsoluteUrl(getLocalizedPath(alternateLocale, `factory/${factory.slug}`)),
        ])
      );

      return {
        url: getAbsoluteUrl(pathname),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: localizedAlternates,
        },
      };
    })
  );

  return [...publicRoutes, ...factoryRoutes];
}
