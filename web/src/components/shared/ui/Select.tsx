"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    label: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    onSearch?: (search: string) => void;
    loading?: boolean;
    disabled?: boolean;
    error?: boolean;
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
}

const DROPDOWN_MIN_W = 200;
const EDGE = 8;
const GAP = 6;

export default function Select({
    label,
    options,
    value,
    onChange,
    onSearch,
    loading = false,
    disabled = false,
    error = false,
    placeholder,
    icon,
    className = "",
}: SelectProps) {
    const t = useTranslations("common");
    const [open, setOpen] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [dropStyle, setDropStyle] = useState<CSSProperties | null>(null);
    const [dropReady, setDropReady] = useState(false);
    const [mounted, setMounted] = useState(false);

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);

    const calcPosition = () => {
        const element = triggerRef.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const viewport = window.visualViewport;
        const viewportWidth = viewport?.width ?? window.innerWidth;
        const viewportHeight = viewport?.height ?? window.innerHeight;
        const offsetLeft = viewport?.offsetLeft ?? 0;
        const offsetTop = viewport?.offsetTop ?? 0;

        const dropWidth = Math.min(
            Math.max(rect.width, DROPDOWN_MIN_W),
            viewportWidth - EDGE * 2,
        );

        let left = rect.left + offsetLeft;
        if (left + dropWidth > offsetLeft + viewportWidth - EDGE) {
            left = rect.right + offsetLeft - dropWidth;
        }
        if (left < offsetLeft + EDGE) left = offsetLeft + EDGE;

        const estimatedPanelHeight = Math.min(
            panelRef.current?.offsetHeight ?? 300,
            viewportHeight - EDGE * 2,
        );
        let top = rect.bottom + offsetTop + GAP;
        if (top + estimatedPanelHeight > offsetTop + viewportHeight - EDGE) {
            top = Math.max(
                offsetTop + EDGE,
                rect.top + offsetTop - estimatedPanelHeight - GAP,
            );
        }

        setDropStyle({
            position: "fixed",
            top,
            left,
            width: dropWidth,
            zIndex: 9999,
        });
    };

    useEffect(() => {
        if (!open) {
            setDropReady(false);
            setDropStyle(null);
            return;
        }

        setDropReady(false);
        calcPosition();

        const rafId = requestAnimationFrame(() => {
            calcPosition();
            setDropReady(true);
        });

        const handleScroll = (event: Event) => {
            const target = event.target as Node | null;

            if (target && panelRef.current?.contains(target)) return;
            if (target && wrapRef.current?.contains(target)) return;

            setOpen(false);
        };

        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", calcPosition);
        window.visualViewport?.addEventListener("resize", calcPosition);

        const observer = new ResizeObserver(() => {
            calcPosition();
        });

        if (triggerRef.current) observer.observe(triggerRef.current);
        if (panelRef.current) observer.observe(panelRef.current);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", calcPosition);
            window.visualViewport?.removeEventListener("resize", calcPosition);
            observer.disconnect();
        };
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!open) {
            setKeyword("");
            onSearch?.("");
            return;
        }

        const timeoutId = window.setTimeout(() => {
            onSearch?.(keyword.trim());
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [open, keyword, onSearch]);

    useEffect(() => {
        const handler = (event: globalThis.MouseEvent) => {
            const target = event.target as Node;
            if (wrapRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            setOpen(false);
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? null,
        [options, value],
    );

    const filteredOptions = useMemo(() => {
        const query = keyword.trim().toLowerCase();
        return query
            ? options.filter((option) =>
                `${option.label} ${option.value}`.toLowerCase().includes(query),
            )
            : options;
    }, [keyword, options]);

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setOpen(false);
    };

    const handleClear = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onChange("");
    };

    const buttonLabel = selectedOption?.label ?? placeholder ?? label;
    const hasValue = Boolean(value);

    return (
        <div className={`relative ${className}`} ref={wrapRef}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((current) => !current)}
                className={[
                    "flex w-full items-center gap-1.5 px-3 py-2 rounded-xl border",
                    "text-sm font-medium transition-colors",
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

                <span className="flex-1 min-w-0 truncate text-left">
                    {loading ? t("loading") : buttonLabel}
                </span>

                <span className="flex items-center gap-1 shrink-0">
                    {hasValue && !disabled && (
                        <span
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={handleClear}
                            aria-label={t("clearSelection")}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </span>
            </button>

            {open &&
                mounted &&
                createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: DROPDOWN_MIN_W,
                            zIndex: 9999,
                            visibility: dropReady ? "visible" : "hidden",
                            ...dropStyle,
                        }}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {label}
                            </p>
                            {hasValue && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                    className="text-xs font-medium text-gray-400 hover:text-rose-500 transition-colors"
                                >
                                    {t("clearSelection")}
                                </button>
                            )}
                        </div>

                        {(onSearch || (!loading && options.length > 0)) && (
                            <div className="border-b border-gray-100 p-3 dark:border-gray-800">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={keyword}
                                        onChange={(event) => setKeyword(event.target.value)}
                                        placeholder={t("quickSearch")}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="px-3 py-2 space-y-2">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <p className="px-3 py-6 text-center text-xs text-gray-400 italic">
                                {t("noOptionsFound")}
                            </p>
                        ) : (
                            <div className="max-h-60 overflow-y-auto py-1.5">
                                {filteredOptions.map((option) => {
                                    const selected = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => handleSelect(option.value)}
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
                                            <span className="line-clamp-2 leading-snug">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
