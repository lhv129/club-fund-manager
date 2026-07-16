// src/components/shared/ui/SelectDropdown.tsx
// FIX responsive: dropdown dùng position:fixed + tính toán JS
// → không bao giờ tràn ra ngoài màn hình trên tablet / mobile
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
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectDropdownProps {
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

const DROPDOWN_W = 320;

export default function SelectDropdown({
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
}: SelectDropdownProps) {
    const t = useTranslations("common");
    const [open, setOpen] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [dropStyle, setDropStyle] = useState<CSSProperties>({});

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // ── Tính vị trí fixed — không bao giờ tràn viewport ─────────────────────────
    const calcPosition = () => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const dropW = Math.min(DROPDOWN_W, vw - 16); // không vượt viewport

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

    // ── Focus search khi mở ──────────────────────────────────────────────────────
    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 60);
        } else {
            setKeyword("");
        }
    }, [open]);

    // ── Click outside ────────────────────────────────────────────────────────────
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

    const filteredOptions = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    }, [keyword, options]);

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

            {/* ── Dropdown (fixed) ─────────────────────────────────────────────── */}
            {open && (
                <div
                    style={dropStyle}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden"
                >
                    {/* Header + Search */}
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between gap-3">
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

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchRef}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder={t("quickSearch")}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                                    bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white
                                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    {loading ? (
                        <div className="px-3 py-2 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs text-gray-400 italic">
                            {t("noOptionsFound")}
                        </p>
                    ) : (
                        <div className="max-h-72 overflow-y-auto py-1.5">
                            {filteredOptions.map((opt) => {
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
