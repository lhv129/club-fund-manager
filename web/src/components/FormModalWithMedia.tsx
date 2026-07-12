"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import MediaUploader, {
    buildMediaPayload,
    MediaItem,
    MediaUploaderState,
} from "@/components/MediaUploader";
import MediaImage, { MediaImageState } from "@/components/MediaImage";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/locales";
import { buildEmptyTranslationValues } from "@/lib/formTranslations";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormFieldDef {
    name: string;
    label: string;
    type:
    | "text"
    | "number"
    | "email"
    | "url"
    | "textarea"
    | "select"
    | "checkbox"
    | "icon-picker"
    | "image";
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
    icons?: { label?: string; value: string }[];
    className?: string;
}

export interface TranslatableFieldDef {
    name: string;
    label: string;
    type: "text" | "textarea" | "url";
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export interface SingleImageFieldDef {
    name: string;
    label: string;
    initialUrl?: string | null;
    required?: boolean;
    className?: string;
}

export interface ServerErrorResponse {
    success: false;
    message?: string;
    errors?: Record<string, string[]>;
}

export type SubmitResult = void | ServerErrorResponse;

interface FormModalWithMediaProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<SubmitResult>;
    title: string;
    fields: FormFieldDef[];
    initialValues?: Record<string, string | number | boolean | null | undefined>;
    translatableFields?: TranslatableFieldDef[];
    initialTranslations?: Record<string, Record<string, unknown>>;
    imageFields?: SingleImageFieldDef[];
    enableMediaUploader?: boolean;
    mediaLabel?: string;
    existingMedia?: MediaItem[];
    maxFiles?: number;
    isEdit?: boolean;
    submitting?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_INITIAL_VALUES: Record<string, string | number | boolean | null | undefined> = {};
const EMPTY_IMAGE_FIELDS: SingleImageFieldDef[] = [];
const EMPTY_TRANSLATABLE_FIELDS: TranslatableFieldDef[] = [];

function getServerError(err: unknown): ServerErrorResponse | null {
    const responseData = (err as { response?: { data?: ServerErrorResponse } })?.response?.data;
    if (responseData) return responseData;
    if (err && typeof err === "object" && "success" in err && (err as ServerErrorResponse).success === false) {
        return err as ServerErrorResponse;
    }
    return null;
}

function firstMsg(messages?: string[]): string {
    return Array.isArray(messages) && messages.length ? messages[0] : "";
}

function appendSingleImagePayload(formData: FormData, fieldName: string, state?: MediaImageState) {
    if (!state) return;
    if (state.file) { formData.append(fieldName, state.file); return; }
    if (state.removed) { formData.append(fieldName, ""); }
}

/**
 * Convert mảng translation đã được TYPE CỤ THỂ (Translation[], ClubTranslation[], ...)
 * sang `Record<locale, Record<string, unknown>>` — đúng shape mà prop `initialTranslations`
 * của FormModalWithMedia cần.
 *
 * Vì sao cần helper này (fix triệt để lỗi TS2352):
 *   Mọi interface translation cụ thể (vd `{ locale: string; name: string; description?: string }`)
 *   KHÔNG có index signature `[key: string]: unknown`, nên TypeScript không cho phép
 *   ép kiểu trực tiếp (`tr as Record<string, unknown>`) — báo lỗi "Conversion ... may be
 *   a mistake" / "Index signature for type 'string' is missing".
 *
 *   Thay vì mỗi page tự viết `.map(tr => [tr.locale, tr as Record<string, unknown>])`
 *   (dễ lặp lại lỗi này ở module khác), dùng chung helper này — cast an toàn qua
 *   `unknown` trước, làm 1 lần duy nhất, review 1 lần duy nhất.
 *
 * Dùng:
 *   initialTranslations={toInitialTranslations(editing?.translations)}
 */
export function toInitialTranslations<T extends { locale: string }>(
    items: T[] | null | undefined
): Record<string, Record<string, unknown>> {
    const result: Record<string, Record<string, unknown>> = {};

    (items ?? []).forEach((item) => {
        // `as unknown as Record<string, unknown>` — điểm cast DUY NHẤT, an toàn vì
        // ta chỉ đọc lại các field theo tên (string key) ở buildEmptyTranslationValues,
        // không có logic nào phụ thuộc vào type cụ thể của T sau bước này.
        result[item.locale] = item as unknown as Record<string, unknown>;
    });

    return result;
}

/**
 * Parse backend errors vào các bucket:
 *   translationErrors: { [localeCode]: { [fieldName]: errorMsg } }
 *   imageErrors:       { [fieldName]: string[] }
 *   mediaErrors:       string[]
 *   restErrors:        { [fieldName]: errorMsg }
 *
 * Xử lý 2 dạng backend trả về:
 *   1. "translations": ["Thiếu bản dịch cho các ngôn ngữ: en."]
 *      → đánh dấu tab locale bị thiếu (general error `_tab`)
 *   2. "translations.vi.name": ["...không được để trống"]
 *      → map locale code → field name
 */
function parseServerErrors(
    errors: Record<string, string[]> | undefined,
    imageFieldNames: string[]
): {
    translationErrors: Record<string, Record<string, string>>;
    imageErrors: Record<string, string[]>;
    mediaErrors: string[];
    restErrors: Record<string, string>;
} {
    const translationErrors: Record<string, Record<string, string>> = {};
    const imageErrors: Record<string, string[]> = {};
    const mediaErrors: string[] = [];
    const restErrors: Record<string, string> = {};

    if (!errors) return { translationErrors, imageErrors, mediaErrors, restErrors };

    Object.entries(errors).forEach(([field, messages]) => {
        // ── image field ──────────────────────────────────────────────────────
        if (imageFieldNames.includes(field)) {
            imageErrors[field] = messages;
            return;
        }

        // ── media field ──────────────────────────────────────────────────────
        if (field.startsWith("media")) {
            const msg = firstMsg(messages);
            if (msg) mediaErrors.push(msg);
            return;
        }

        // ── translations (general) — "translations" only, no dot ─────────────
        // Backend: { "translations": ["Thiếu bản dịch cho các ngôn ngữ: en."] }
        if (field === "translations") {
            const msg = firstMsg(messages);
            LOCALES.forEach((locale) => {
                if (msg.includes(locale.code)) {
                    translationErrors[locale.code] = {
                        ...translationErrors[locale.code],
                        _tab: msg,
                    };
                }
            });
            return;
        }

        // ── translations.{localeCode}.{fieldName} ────────────────────────────
        // Backend: { "translations.vi.name": ["...không được để trống"] }
        const translationMatch = field.match(/^translations\.([^.]+)\.(.+)$/);
        if (translationMatch) {
            const localeCode = translationMatch[1];
            const fieldName = translationMatch[2];
            translationErrors[localeCode] = {
                ...translationErrors[localeCode],
                [fieldName]: firstMsg(messages),
            };
            return;
        }

        // ── regular field ────────────────────────────────────────────────────
        const msg = firstMsg(messages);
        if (msg) restErrors[field] = msg;
    });

    return { translationErrors, imageErrors, mediaErrors, restErrors };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormModalWithMedia({
    isOpen,
    onClose,
    onSubmit,
    title,
    fields,
    initialValues,
    translatableFields,
    initialTranslations,
    imageFields,
    enableMediaUploader = false,
    mediaLabel,
    existingMedia = [],
    maxFiles = 6,
    isEdit = false,
    submitting = false,
    submitLabel,
    cancelLabel,
}: FormModalWithMediaProps) {
    const t = useTranslations("common");

    const resolvedInitialValues = initialValues ?? EMPTY_INITIAL_VALUES;
    const resolvedImageFields = imageFields ?? EMPTY_IMAGE_FIELDS;
    const resolvedTranslatableFields = translatableFields ?? EMPTY_TRANSLATABLE_FIELDS;
    const resolvedSubmitLabel = submitLabel ?? (isEdit ? t("save") : t("create"));
    const resolvedCancelLabel = cancelLabel ?? t("cancel");
    const resolvedMediaLabel = mediaLabel ?? t("images");

    const imageFieldNames = useMemo(
        () => resolvedImageFields.map((f) => f.name),
        [resolvedImageFields]
    );

    // ── State ─────────────────────────────────────────────────────────────────
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [activeLocale, setActiveLocale] = useState<string>(DEFAULT_LOCALE);
    const [translationValues, setTranslationValues] = useState<Record<string, Record<string, string>>>({});
    const [translationErrors, setTranslationErrors] = useState<Record<string, Record<string, string>>>({});

    const [imageErrors, setImageErrors] = useState<Record<string, string[]>>({});
    const [imageStates, setImageStates] = useState<Record<string, MediaImageState>>({});
    const [mediaErrors, setMediaErrors] = useState<string[]>([]);
    const [mediaState, setMediaState] = useState<MediaUploaderState | null>(null);

    // ── Reset khi mở modal ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        setValues(Object.fromEntries(fields.map((f) => [f.name, String(resolvedInitialValues[f.name] ?? "")])));
        setErrors({});
        setImageErrors({});
        setMediaErrors([]);
        setMediaState(null);
        setActiveLocale(DEFAULT_LOCALE);
        setTranslationErrors({});
        setTranslationValues(
            buildEmptyTranslationValues(
                resolvedTranslatableFields.map((f) => f.name),
                initialTranslations
            )
        );
        setImageStates(
            Object.fromEntries(
                resolvedImageFields.map((f) => [
                    f.name,
                    { file: null, preview: f.initialUrl ?? null, removed: false },
                ])
            )
        );
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const isChecked = (name: string) => values[name] === "true" || values[name] === "1";

    const applyServerErrors = (res: ServerErrorResponse) => {
        const { translationErrors: nextTransErr, imageErrors: nextImgErr, mediaErrors: nextMediaErr, restErrors } =
            parseServerErrors(res.errors, imageFieldNames);

        setErrors(restErrors);
        setImageErrors(nextImgErr);
        setMediaErrors(nextMediaErr);
        setTranslationErrors(nextTransErr);

        // Nhảy sang tab đầu tiên có lỗi
        if (!nextTransErr[activeLocale]) {
            const localeWithError = Object.keys(nextTransErr)[0];
            if (localeWithError) setActiveLocale(localeWithError);
        }

        toast.error(res.message || t("validationError"));
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setImageErrors({});
        setMediaErrors([]);
        setTranslationErrors({});

        const formData = new FormData();

        fields.forEach((field) => {
            if (field.type === "checkbox") {
                formData.append(field.name, isChecked(field.name) ? "1" : "0");
            } else {
                formData.append(field.name, values[field.name] ?? "");
            }
        });

        if (resolvedTranslatableFields.length > 0) {
            // Gửi translations[vi][name]=... thay vì translations[0][locale]=vi&translations[0][name]=...
            // → backend error key sẽ là "translations.vi.name", không phụ thuộc thứ tự
            LOCALES.forEach((locale) => {
                resolvedTranslatableFields.forEach((field) => {
                    formData.append(
                        `translations[${locale.code}][${field.name}]`,
                        translationValues[locale.code]?.[field.name] ?? ""
                    );
                });
            });
        }

        resolvedImageFields.forEach((field) => {
            appendSingleImagePayload(formData, field.name, imageStates[field.name]);
        });

        if (enableMediaUploader && mediaState) {
            buildMediaPayload(formData, mediaState, isEdit);
        }

        try {
            const res = await onSubmit(formData);
            if (res && res.success === false) applyServerErrors(res);
        } catch (err: unknown) {
            const res = getServerError(err);
            if (res) { applyServerErrors(res); return; }
            toast.error(t("validationError"));
        }
    };

    // ── Change handlers ───────────────────────────────────────────────────────
    const handleChange = (name: string, value: string) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleTranslationChange = (locale: string, name: string, value: string) => {
        setTranslationValues((prev) => ({ ...prev, [locale]: { ...prev[locale], [name]: value } }));
        if (translationErrors[locale]?.[name]) {
            setTranslationErrors((prev) => ({ ...prev, [locale]: { ...prev[locale], [name]: "" } }));
        }
    };

    const handleImageChange = (name: string, state: MediaImageState) => {
        setImageStates((prev) => ({ ...prev, [name]: state }));
        if (imageErrors[name]?.length) setImageErrors((prev) => ({ ...prev, [name]: [] }));
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const inputCls = (hasError: boolean) =>
        `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800
        text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none
        focus:ring-2 transition-colors
        ${hasError
            ? "border-rose-400 dark:border-rose-500 focus:ring-rose-500"
            : "border-gray-200 dark:border-gray-700 focus:ring-indigo-500"
        }`;

    const renderError = (message?: string) =>
        message ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {message}
            </p>
        ) : null;

    const renderField = (field: FormFieldDef) => {
        const err = errors[field.name];

        if (field.type === "checkbox") return (
            <>
                <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked(field.name)}
                        onClick={() => handleChange(field.name, isChecked(field.name) ? "0" : "1")}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2
                            border-transparent transition-colors duration-200 ease-in-out
                            focus-visible:ring-2 focus-visible:ring-indigo-500
                            ${isChecked(field.name) ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full
                            bg-white shadow-lg transition
                            ${isChecked(field.name) ? "translate-x-5" : "translate-x-0"}`}
                        />
                    </button>
                </div>
                {renderError(err)}
            </>
        );

        if (field.type === "icon-picker") return (
            <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg border bg-white dark:bg-gray-800">
                        {values[field.name]
                            ? <i className={`las ${values[field.name]} text-xl`} />
                            : <span className="text-gray-400 text-xs">—</span>
                        }
                    </div>
                    <input
                        type="text" readOnly value={values[field.name] ?? ""}
                        placeholder={field.placeholder}
                        className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800
                            text-gray-900 dark:text-white
                            ${err ? "border-rose-400" : "border-gray-200 dark:border-gray-700"}`}
                    />
                </div>
                <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded-xl">
                    {field.icons?.map((icon) => (
                        <button key={icon.value} type="button"
                            onClick={() => handleChange(field.name, icon.value)}
                            className={`p-2 rounded-lg border transition hover:bg-gray-100 dark:hover:bg-gray-700
                                ${values[field.name] === icon.value
                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                                    : "border-gray-200 dark:border-gray-700"}`}
                        >
                            <i className={`las ${icon.value} text-lg`} />
                        </button>
                    ))}
                </div>
                {renderError(err)}
            </>
        );

        return (
            <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {field.type === "textarea" ? (
                    <textarea
                        value={values[field.name] ?? ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className={`${inputCls(!!err)} resize-none`}
                    />
                ) : field.type === "select" ? (
                    <select
                        value={values[field.name] ?? ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className={inputCls(!!err)}
                    >
                        <option value="">{field.placeholder ?? t("chooseOption")}</option>
                        {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={field.type}
                        value={values[field.name] ?? ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={inputCls(!!err)}
                    />
                )}
                {renderError(err)}
            </>
        );
    };

    // ── Locale tab helpers ────────────────────────────────────────────────────
    const localeHasError = (code: string) =>
        !!translationErrors[code] && Object.values(translationErrors[code]).some(Boolean);

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={submitting ? undefined : onClose}
            />

            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col
                bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                border border-gray-200 dark:border-gray-800">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4
                    border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <button
                        type="button" onClick={onClose} disabled={submitting}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                            hover:text-gray-600 dark:hover:text-gray-300
                            hover:bg-gray-100 dark:hover:bg-gray-800
                            transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                        {/* Regular fields */}
                        {fields.map((field) => (
                            <div key={field.name} className={field.className}>
                                {renderField(field)}
                            </div>
                        ))}

                        {/* Translatable fields — tab per locale */}
                        {resolvedTranslatableFields.length > 0 && (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                {/* Tabs */}
                                <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    {LOCALES.map((locale) => {
                                        const hasErr = localeHasError(locale.code);
                                        const isActive = activeLocale === locale.code;
                                        return (
                                            <button
                                                key={locale.code}
                                                type="button"
                                                onClick={() => setActiveLocale(locale.code)}
                                                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                                                    border-b-2 transition-colors
                                                    ${isActive
                                                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                    }`}
                                            >
                                                {locale.label}
                                                {/* Chấm đỏ nhấp nháy khi có lỗi */}
                                                {hasErr && (
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tab general error (thiếu bản dịch) */}
                                {translationErrors[activeLocale]?._tab && (
                                    <div className="flex items-center gap-2 px-4 py-2
                                        bg-rose-50 dark:bg-rose-500/10
                                        border-b border-rose-100 dark:border-rose-500/20">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                        <p className="text-xs text-rose-500">
                                            {translationErrors[activeLocale]._tab}
                                        </p>
                                    </div>
                                )}

                                {/* Fields */}
                                <div className="p-4 space-y-4">
                                    {resolvedTranslatableFields.map((field) => {
                                        const value = translationValues[activeLocale]?.[field.name] ?? "";
                                        const err = translationErrors[activeLocale]?.[field.name];
                                        return (
                                            <div key={field.name} className={field.className}>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    {field.label}
                                                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                                                </label>
                                                {field.type === "textarea" ? (
                                                    <textarea
                                                        value={value}
                                                        onChange={(e) => handleTranslationChange(activeLocale, field.name, e.target.value)}
                                                        placeholder={field.placeholder}
                                                        rows={3}
                                                        className={`${inputCls(!!err)} resize-none`}
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={value}
                                                        onChange={(e) => handleTranslationChange(activeLocale, field.name, e.target.value)}
                                                        placeholder={field.placeholder}
                                                        className={inputCls(!!err)}
                                                    />
                                                )}
                                                {renderError(err)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Image fields */}
                        {resolvedImageFields.map((imageField) => (
                            <div key={imageField.name} className={imageField.className}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {imageField.label}
                                    {imageField.required && <span className="text-rose-500 ml-1">*</span>}
                                </label>
                                <MediaImage
                                    initialUrl={imageField.initialUrl ?? null}
                                    errors={imageErrors[imageField.name] ?? []}
                                    onChange={(state) => handleImageChange(imageField.name, state)}
                                />
                            </div>
                        ))}

                        {/* Media uploader */}
                        {enableMediaUploader && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {resolvedMediaLabel}
                                </label>
                                <MediaUploader
                                    existingMedia={existingMedia}
                                    maxFiles={maxFiles}
                                    errors={mediaErrors}
                                    onChange={setMediaState}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2.5 px-6 py-4
                        border-t border-gray-100 dark:border-gray-800 shrink-0">
                        <button
                            type="button" onClick={onClose} disabled={submitting}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                                text-sm font-medium text-gray-700 dark:text-gray-300
                                hover:bg-gray-50 dark:hover:bg-gray-800
                                disabled:opacity-50 transition-colors"
                        >
                            {resolvedCancelLabel}
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl
                                bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                                text-white text-sm font-medium transition-colors"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {resolvedSubmitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
