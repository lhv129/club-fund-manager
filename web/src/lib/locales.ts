import localesConfig from "@/config/locales.json";

export type LocaleOption = {
    code: string;
    label: string;
    flag: string;
};

/** Nguồn duy nhất cho locale — đọc từ config/locales.json */
export const LOCALES: LocaleOption[] = localesConfig.locales;
export const LOCALE_CODES: string[] = LOCALES.map((l) => l.code);
export const DEFAULT_LOCALE: string = localesConfig.defaultLocale;
export const FALLBACK_LOCALE: string = localesConfig.defaultLocale;

/** Regex động — tự cập nhật khi thêm locale vào locales.json */
export const LOCALE_PATH_REGEX = new RegExp(
    `^\\/(${LOCALE_CODES.join("|")})(\\\/|$)`
);
