import type { MetadataRoute } from "next";
import { getFactories } from "@/lib/factory-data";
import { getAbsoluteUrl, getLocalizedPath } from "@/lib/seo";

const publicRouteSuffixes = ["", "factories", "pricing", "brand-launchpad"];
const locales = ["en", "th"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicRoutes = locales.flatMap((locale) =>
    publicRouteSuffixes.map((suffix) => {
      const pathname = getLocalizedPath(locale, suffix);
      const localizedAlternates = Object.fromEntries(
        locales.map((alternateLocale) => [
          alternateLocale,
          getAbsoluteUrl(getLocalizedPath(alternateLocale, suffix)),
        ])
      );

      return {
        url: getAbsoluteUrl(pathname),
        lastModified: now,
        changeFrequency: suffix === "" ? "weekly" : "daily",
        priority: suffix === "" ? 1 : 0.8,
        alternates: {
          languages: localizedAlternates,
        },
      };
    })
  );

  const englishFactories = getFactories("en");

  const factoryRoutes = locales.flatMap((locale) =>
    englishFactories.map((factory) => {
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
