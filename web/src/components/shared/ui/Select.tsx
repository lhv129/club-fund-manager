// src/components/shared/ui/Select.tsx
// Giống SelectDropdown nhưng KHÔNG có search — dùng cho filter status, email_verified_at, ...
// Fix responsive triệt để: dropdown dùng position:fixed + tính toán JS để không bao giờ tràn ra ngoài màn hình
"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, X } from "lucide-react";

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    label: string;
    options: SelectOption[];
    value: string;
    onChange: (v: string) => void;
    loading?: boolean;
    disabled?: boolean;
    error?: boolean;
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
}

const DROPDOWN_MIN_W = 200;

export default function Select({
    label,
    options,
    value,
    onChange,
    loading = false,
    disabled = false,
    error = false,
    placeholder,
    icon,
    className = "",
}: SelectProps) {
    const t = useTranslations("common");
    const [open, setOpen] = useState(false);
    const [dropStyle, setDropStyle] = useState<CSSProperties>({});

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // ── Tính vị trí dropdown bằng fixed + JS → không bao giờ tràn viewport ──────
    const calcPosition = () => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dropW = Math.max(rect.width, DROPDOWN_MIN_W);
        const vw = window.innerWidth;

        // Ưu tiên left-align với trigger; nếu tràn phải thì flip sang right-align
        let left = rect.left;
        if (left + dropW > vw - 8) left = rect.right - dropW;
        if (left < 8) left = 8;

        setDropStyle({
            position: "fixed",
            top: rect.bottom + 6,
            left,
            width: dropW,
            zIndex: 9999,
        });
    };

    useEffect(() => {
        if (!open) return;
        calcPosition();
        window.addEventListener("scroll", calcPosition, true);
        window.addEventListener("resize", calcPosition);
        return () => {
            window.removeEventListener("scroll", calcPosition, true);
            window.removeEventListener("resize", calcPosition);
        };
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Click outside ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: globalThis.MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedOption = useMemo(
        () => options.find((o) => o.value === value) ?? null,
        [options, value],
    );

    const handleSelect = (val: string) => { onChange(val); setOpen(false); };
    const handleClear = (e: MouseEvent) => { e.stopPropagation(); onChange(""); };

    const buttonLabel = selectedOption?.label ?? placeholder ?? label;
    const hasValue = !!value;

    return (
        <div className={`relative shrink-0 ${className}`} ref={wrapRef}>
            {/* ── Trigger ─────────────────────────────────────────────────────── */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((v) => !v)}
                className={[
                    "inline-flex max-w-full items-center gap-1.5 px-3 py-2 rounded-xl border",
                    "text-sm font-medium transition-colors whitespace-nowrap",
                    disabled
                        ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
                        : "cursor-pointer",
                    error
                        ? "border-rose-400"
                        : hasValue
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
                ].join(" ")}
            >
                {icon && <span className="shrink-0 text-gray-400">{icon}</span>}

                <span className="max-w-[150px] truncate">
                    {loading ? t("loading") : buttonLabel}
                </span>

                {hasValue && !disabled && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={handleClear}
                        aria-label={t("clearSelection")}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <X className="w-3 h-3" />
                    </span>
                )}

                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* ── Dropdown (fixed — không bao giờ tràn ra ngoài màn hình) ─────── */}
            {open && (
                <div
                    style={dropStyle}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {label}
                        </p>
                        {hasValue && (
                            <button
                                type="button"
                                onClick={() => { onChange(""); setOpen(false); }}
                                className="text-xs font-medium text-gray-400 hover:text-rose-500 transition-colors"
                            >
                                {t("clearSelection")}
                            </button>
                        )}
                    </div>

                    {/* Options */}
                    {loading ? (
                        <div className="px-3 py-2 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                            ))}
                        </div>
                    ) : options.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs text-gray-400 italic">
                            {t("noOptionsFound")}
                        </p>
                    ) : (
                        <div className="max-h-60 overflow-y-auto py-1.5">
                            {options.map((opt) => {
                                const selected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={[
                                            "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors",
                                            selected
                                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                                        ].join(" ")}
                                    >
                                        <div
                                            className={[
                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                                selected
                                                    ? "bg-indigo-600 border-indigo-600"
                                                    : "border-gray-300 dark:border-gray-600",
                                            ].join(" ")}
                                        >
                                            {selected && <Check className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        <span className="line-clamp-2 leading-snug">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
