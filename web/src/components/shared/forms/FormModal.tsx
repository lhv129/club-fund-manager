"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/locales";
import { splitTranslationErrors, buildEmptyTranslationValues } from "@/lib/formTranslations";
import DatePicker from "@/components/shared/ui/DatePicker";
import Select from "@/components/shared/ui/Select";
import { RichEditor } from "@/components/shared/ui/RichEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormFieldDef {
    name: string;
    label: string;
    type:
    | "text"
    | "number"
    | "email"
    | "url"
    | "password"
    | "textarea"
    | "richtext"
    | "select"
    | "datepicker"
    | "checkbox"
    | "icon-picker"
    | "image";
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
    icons?: { label?: string; value: string }[];
    className?: string;
}

/** Field lặp lại theo từng locale (vd: name, slug, description). */
export interface TranslatableFieldDef {
    name: string;
    label: string;
    type: "text" | "textarea" | "richtext" | "url";
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export interface ServerErrorResponse {
    success: false;
    message?: string;
    errors?: Record<string, string[]>;
}

export type SubmitResult = void | ServerErrorResponse;

/** 1 entry translation gửi lên onSubmit — { locale, ...các field translatable }. */
export type TranslationEntry = { locale: string } & Record<string, string>;

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ) => Promise<SubmitResult>;
    title: string;
    fields: FormFieldDef[];
    initialValues?: Record<string, string | number | boolean | null | undefined>;

    /** Field lặp theo locale — hiện dưới dạng tab (vd: name/slug/description). */
    translatableFields?: TranslatableFieldDef[];
    /** Giá trị ban đầu theo locale: { vi: { name: "..." }, en: { name: "..." } }. */
    initialTranslations?: Record<string, Record<string, unknown>>;

    isEdit?: boolean;
    submitting?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_INITIAL_VALUES: Record<
    string,
    string | number | boolean | null | undefined
> = {};

const EMPTY_TRANSLATABLE_FIELDS: TranslatableFieldDef[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getServerError(err: unknown): ServerErrorResponse | null {
    const responseData = (err as { response?: { data?: ServerErrorResponse } })
        ?.response?.data;
    if (responseData) return responseData;
    if (
        err &&
        typeof err === "object" &&
        "success" in err &&
        (err as ServerErrorResponse).success === false
    ) {
        return err as ServerErrorResponse;
    }
    return null;
}

function getFirstError(messages?: string[]) {
    if (!Array.isArray(messages) || messages.length === 0) return "";
    return messages[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    fields,
    initialValues,
    translatableFields,
    initialTranslations,
    isEdit = false,
    submitting = false,
    submitLabel,
    cancelLabel,
}: FormModalProps) {
    const t = useTranslations("common");
    const resolvedInitialValues = initialValues ?? EMPTY_INITIAL_VALUES;
    const resolvedTranslatableFields = translatableFields ?? EMPTY_TRANSLATABLE_FIELDS;
    const resolvedSubmitLabel = submitLabel ?? (isEdit ? t("save") : t("create"));
    const resolvedCancelLabel = cancelLabel ?? t("cancel");

    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [activeLocale, setActiveLocale] = useState<string>(DEFAULT_LOCALE);
    const [translationValues, setTranslationValues] = useState<
        Record<string, Record<string, string>>
    >({});
    const [translationErrors, setTranslationErrors] = useState<
        Record<string, Record<string, string>>
    >({});

    // ── Reset khi mở modal ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        setValues(
            Object.fromEntries(
                fields.map((field) => [
                    field.name,
                    String(resolvedInitialValues[field.name] ?? ""),
                ])
            )
        );
        setErrors({});
        setActiveLocale(DEFAULT_LOCALE);
        setTranslationErrors({});
        setTranslationValues(
            buildEmptyTranslationValues(
                resolvedTranslatableFields.map((f) => f.name),
                initialTranslations
            )
        );
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen) return null;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const isChecked = (name: string) =>
        values[name] === "true" || values[name] === "1";

    const applyServerErrors = (res: ServerErrorResponse) => {
        const { translationErrors: nextTranslationErrors, restErrors } =
            splitTranslationErrors(res.errors, getFirstError);

        setErrors(restErrors);
        setTranslationErrors(nextTranslationErrors);

        if (!nextTranslationErrors[activeLocale]) {
            const localeWithError = Object.keys(nextTranslationErrors)[0];
            if (localeWithError) setActiveLocale(localeWithError);
        }

        toast.error(res.message || t("validationError"));
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setErrors({});
        setTranslationErrors({});

        const translations: TranslationEntry[] = resolvedTranslatableFields.length
            ? LOCALES.map((locale) => ({
                locale: locale.code,
                ...translationValues[locale.code],
            }))
            : [];

        try {
            const res = await onSubmit(
                values,
                resolvedTranslatableFields.length ? translations : undefined
            );
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
        setTranslationValues((prev) => ({
            ...prev,
            [locale]: { ...prev[locale], [name]: value },
        }));
        if (translationErrors[locale]?.[name]) {
            setTranslationErrors((prev) => ({
                ...prev,
                [locale]: { ...prev[locale], [name]: "" },
            }));
        }
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const inputCls = (hasError: boolean) =>
        `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800
        text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none
        focus:ring-2 focus:ring-indigo-500 transition-colors
        ${hasError
            ? "border-rose-400 dark:border-rose-500 focus:ring-rose-500"
            : "border-gray-200 dark:border-gray-700"
        }`;

    const renderError = (message?: string) => {
        if (!message) return null;
        return (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {message}
            </p>
        );
    };

    const renderField = (field: FormFieldDef) => {
        const err = errors[field.name];
        const val = values[field.name] ?? "";

        // ── Checkbox (toggle switch) ──────────────────────────────────────────
        if (field.type === "checkbox") return (
            <>
                <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {field.label}
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked(field.name)}
                        onClick={() =>
                            handleChange(field.name, isChecked(field.name) ? "0" : "1")
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
                            border-2 border-transparent transition-colors duration-200 ease-in-out
                            focus-visible:ring-2 focus-visible:ring-indigo-500
                            ${isChecked(field.name)
                                ? "bg-indigo-600"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform
                                rounded-full bg-white shadow-lg transition
                                ${isChecked(field.name) ? "translate-x-5" : "translate-x-0"}`}
                        />
                    </button>
                </div>
                {renderError(err)}
            </>
        );

        // ── Icon picker ───────────────────────────────────────────────────────
        if (field.type === "icon-picker") return (
            <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg border
                        bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        {val
                            ? <i className={`las ${val} text-xl`} />
                            : <span className="text-gray-400 text-xs">—</span>
                        }
                    </div>
                    <input
                        type="text" readOnly value={val}
                        {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                        className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800
                            text-gray-900 dark:text-white
                            ${err
                                ? "border-rose-400 dark:border-rose-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                    />
                </div>
                <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded-xl
                    border-gray-200 dark:border-gray-700">
                    {field.icons?.length
                        ? field.icons.map((icon) => (
                            <button
                                key={icon.value}
                                type="button"
                                onClick={() => handleChange(field.name, icon.value)}
                                className={`p-2 rounded-lg border transition
                                    hover:bg-gray-100 dark:hover:bg-gray-700
                                    ${val === icon.value
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                                        : "border-gray-200 dark:border-gray-700"
                                    }`}
                            >
                                <i className={`las ${icon.value} text-lg`} />
                            </button>
                        ))
                        : <div className="text-xs text-gray-400">No icons</div>
                    }
                </div>
                {renderError(err)}
            </>
        );

        // ── Select — custom Select component ──────────────────────────────────
        if (field.type === "select") return (
            <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <Select
                    label={field.label}
                    options={field.options ?? []}
                    value={val}
                    onChange={(v) => handleChange(field.name, v)}
                    {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                    error={!!err}
                    className="w-full [&>button]:w-full"
                />
                {renderError(err)}
            </>
        );

        // ── DatePicker ────────────────────────────────────────────────────────
        if (field.type === "datepicker") return (
            <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <DatePicker
                    value={val}
                    onChange={(v) => handleChange(field.name, v)}
                    rounded="rounded-xl"
                    className={err ? "border-rose-400 dark:border-rose-500" : ""}
                />
                {renderError(err)}
            </>
        );

        // ── RichText ──────────────────────────────────────────────────────────
        if (field.type === "richtext") return (
            <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <RichEditor
                    value={val}
                    onChange={(v) => handleChange(field.name, v)}
                    placeholder={field.placeholder}
                    error={err}
                />
                {renderError(err)}
            </>
        );

        // ── Textarea / text / email / url / number / password ─────────────────
        return (
            <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}{field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {field.type === "textarea" ? (
                    <textarea
                        value={val}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        rows={4}
                        {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                        className={`${inputCls(!!err)} resize-none`}
                    />
                ) : (
                    <input
                        type={field.type}
                        value={val}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                        className={inputCls(!!err)}
                    />
                )}
                {renderError(err)}
            </>
        );
    };

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={submitting ? undefined : onClose}
            />

            <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col
                bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                border border-gray-200 dark:border-gray-800">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4
                    border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
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
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                {/* Tabs */}
                                <div className="mb-3 flex gap-2 border-b border-gray-100 dark:border-gray-800">
                                    {LOCALES.map((locale) => {
                                        const hasError =
                                            !!translationErrors[locale.code] &&
                                            Object.values(translationErrors[locale.code]).some(Boolean);
                                        return (
                                            <button
                                                key={locale.code}
                                                type="button"
                                                onClick={() => setActiveLocale(locale.code)}
                                                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors
                                                    ${activeLocale === locale.code
                                                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                    }`}
                                            >
                                                {locale.label}
                                                {hasError && (
                                                    <span className="ml-1 text-rose-500">•</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Fields theo locale */}
                                <div className="space-y-4">
                                    {resolvedTranslatableFields.map((field) => {
                                        const value =
                                            translationValues[activeLocale]?.[field.name] ?? "";
                                        const errorMessage =
                                            translationErrors[activeLocale]?.[field.name];

                                        return (
                                            <div key={field.name} className={field.className}>
                                                <label className="block text-sm font-medium
                                                    text-gray-700 dark:text-gray-300 mb-1.5">
                                                    {field.label}
                                                    {field.required && (
                                                        <span className="text-rose-500 ml-1">*</span>
                                                    )}
                                                </label>

                                                {field.type === "richtext" ? (
                                                    <RichEditor
                                                        value={value}
                                                        onChange={(v) =>
                                                            handleTranslationChange(
                                                                activeLocale,
                                                                field.name,
                                                                v
                                                            )
                                                        }
                                                        placeholder={field.placeholder}
                                                        error={errorMessage}
                                                    />
                                                ) : field.type === "textarea" ? (
                                                    <textarea
                                                        value={value}
                                                        onChange={(e) =>
                                                            handleTranslationChange(
                                                                activeLocale,
                                                                field.name,
                                                                e.target.value
                                                            )
                                                        }
                                                        rows={4}
                                                        {...(field.placeholder
                                                            ? { placeholder: field.placeholder }
                                                            : {})}
                                                        className={`${inputCls(!!errorMessage)} resize-none`}
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={value}
                                                        onChange={(e) =>
                                                            handleTranslationChange(
                                                                activeLocale,
                                                                field.name,
                                                                e.target.value
                                                            )
                                                        }
                                                        {...(field.placeholder
                                                            ? { placeholder: field.placeholder }
                                                            : {})}
                                                        className={inputCls(!!errorMessage)}
                                                    />
                                                )}

                                                {renderError(errorMessage)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2.5 px-6 py-4
                        border-t border-gray-100 dark:border-gray-800 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                                text-sm font-medium text-gray-700 dark:text-gray-300
                                hover:bg-gray-50 dark:hover:bg-gray-800
                                disabled:opacity-50 transition-colors"
                        >
                            {resolvedCancelLabel}
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
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