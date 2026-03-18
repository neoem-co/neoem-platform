"use client";

import enFactoriesData from "@/data/enfactories.json";
import thFactoriesData from "@/data/thfactories.json";

type FactoryDataFile = typeof enFactoriesData;

export type FactoryRecord = FactoryDataFile["factories"][number];
export type FactoryChatMessage = NonNullable<FactoryDataFile["chatHistory"]>[number];

const englishFactoriesBySlug = new Map(
    enFactoriesData.factories.map((factory) => [factory.slug, factory] as const)
);

const thaiFactoriesBySlug = new Map(
    thFactoriesData.factories.map((factory) => [factory.slug, factory] as const)
);

function normalizeValue(value: string) {
    return value.trim().toLowerCase();
}

export function isThaiLocale(locale?: string) {
    return locale?.toLowerCase().startsWith("th") ?? false;
}

export function getFactoriesData(locale?: string): FactoryDataFile {
    return isThaiLocale(locale) ? thFactoriesData : enFactoriesData;
}

export function getFactories(locale?: string): FactoryRecord[] {
    return getFactoriesData(locale).factories;
}

export function getFactoryBySlug(slug: string, locale?: string): FactoryRecord | undefined {
    return getFactories(locale).find((factory) => factory.slug === slug);
}

export function getFactoryChatHistory(locale?: string): FactoryChatMessage[] {
    const dataset = getFactoriesData(locale);
    if (dataset.chatHistory.length > 0) {
        return dataset.chatHistory as FactoryChatMessage[];
    }

    return enFactoriesData.chatHistory as FactoryChatMessage[];
}

export function getFactoryLocaleVariant(factory: Pick<FactoryRecord, "slug">, locale?: string) {
    return isThaiLocale(locale)
        ? englishFactoriesBySlug.get(factory.slug)
        : thaiFactoriesBySlug.get(factory.slug);
}

export function getFactoryCategoryId(factory: Pick<FactoryRecord, "slug" | "category">) {
    const englishCategory = englishFactoriesBySlug.get(factory.slug)?.category ?? factory.category;
    const normalized = normalizeValue(englishCategory);

    if (normalized.includes("cosmetic")) return "cosmetics";
    if (normalized.includes("supplement")) return "supplements";
    if (normalized.includes("packag")) return "packaging";
    if (normalized.includes("cloth") || normalized.includes("apparel") || normalized.includes("garment")) return "clothing";
    if (normalized.includes("skin care") || normalized.includes("skincare")) return "skincare";
    if (normalized.includes("food") || normalized.includes("beverage")) return "food";

    return normalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getFactorySearchableText(factory: FactoryRecord, locale?: string) {
    const variant = getFactoryLocaleVariant(factory, locale);
    const parts = [
        factory.name,
        factory.description,
        factory.category,
        factory.location,
        ...factory.specialties,
        ...factory.tags,
    ];

    if (variant) {
        parts.push(
            variant.name,
            variant.description,
            variant.category,
            variant.location,
            ...variant.specialties,
            ...variant.tags
        );
    }

    return parts.join(" ").toLowerCase();
}
