import type { Translation } from "../types";

export type ClubTranslationsForm = {
    vi: { name: string; slug: string; description: string };
    en: { name: string; slug: string; description: string };
};

const EMPTY_TRANSLATION = { name: "", slug: "", description: "" };

export function emptyTranslationsForm(): ClubTranslationsForm {
    return {
        vi: { ...EMPTY_TRANSLATION },
        en: { ...EMPTY_TRANSLATION },
    };
}

/** translations[] (từ API detail) → object theo locale (cho form). */
export function translationsToFormValues(
    translations: Translation[] = []
): ClubTranslationsForm {
    const result = emptyTranslationsForm();

    for (const t of translations) {
        if (t.locale === "vi" || t.locale === "en") {
            result[t.locale] = {
                name: t.name ?? "",
                slug: t.slug ?? "",
                description: t.description ?? "",
            };
        }
    }

    return result;
}

/** object theo locale (từ form) → translations[] (payload gửi lên API). */
export function formValuesToTranslations(
    values: ClubTranslationsForm
): Translation[] {
    return (Object.keys(values) as Array<keyof ClubTranslationsForm>).map(
        (locale) => ({
            locale,
            name: values[locale].name,
            slug: values[locale].slug,
            description: values[locale].description || null,
        })
    );
}