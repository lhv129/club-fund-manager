import { LOCALES } from "@/lib/locales";

/**
 * Tạo state ban đầu cho translationValues:
 *   { vi: { name: "", slug: "" }, en: { name: "", slug: "" } }
 *
 * Nếu có initialTranslations, điền giá trị hiện có vào.
 */
export function buildEmptyTranslationValues(
    fieldNames: string[],
    initialTranslations?: Record<string, Record<string, unknown>>
): Record<string, Record<string, string>> {
    return Object.fromEntries(
        LOCALES.map((locale) => {
            const existing = initialTranslations?.[locale.code] ?? {};
            return [
                locale.code,
                Object.fromEntries(
                    fieldNames.map((name) => [
                        name,
                        String(existing[name] ?? ""),
                    ])
                ),
            ];
        })
    );
}

/**
 * Tách errors từ backend thành translationErrors + restErrors.
 *
 * Hỗ trợ key: "translations.vi.name" — locale code làm key (không phải index).
 */
export function splitTranslationErrors(
    errors: Record<string, string[]> | undefined,
    getFirst: (msgs?: string[]) => string
): {
    translationErrors: Record<string, Record<string, string>>;
    restErrors: Record<string, string>;
} {
    const translationErrors: Record<string, Record<string, string>> = {};
    const restErrors: Record<string, string> = {};

    if (!errors) return { translationErrors, restErrors };

    Object.entries(errors).forEach(([field, messages]) => {
        // "translations.vi.name" — locale code làm key
        const match = field.match(/^translations\.([^.]+)\.(.+)$/);
        if (match) {
            const localeCode = match[1];
            const fieldName = match[2];
            const locale = LOCALES.find((l) => l.code === localeCode);
            if (locale) {
                translationErrors[locale.code] = {
                    ...translationErrors[locale.code],
                    [fieldName]: getFirst(messages),
                };
            }
            return;
        }

        if (field !== "translations") {
            const msg = getFirst(messages);
            if (msg) restErrors[field] = msg;
        }
    });

    return { translationErrors, restErrors };
}