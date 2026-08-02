// src/lib/translations.ts

import type { Translation } from "@/domains/club/types";

/**
 * Tìm translation theo locale hiện tại, fallback về phần tử đầu tiên.
 */
export function getTranslation<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): T | undefined {
    return translations?.find((t) => t.locale === locale) ?? translations?.[0];
}

/** Lấy name theo locale */
export function getTranslatedName<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): string {
    return getTranslation(translations, locale)?.name ?? "";
}

/** Lấy slug theo locale */
export function getTranslatedSlug<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): string | undefined {
    return getTranslation(translations, locale)?.slug;
}

/** Lấy description theo locale */
export function getTranslatedDescription<T extends Translation>(
    translations: T[] | undefined,
    locale: string
): string {
    return getTranslation(translations, locale)?.description ?? "";
}