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
import { createPortal } from "react-dom";
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
const EDGE = 8;
const GAP = 6;

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
    const [mounted, setMounted] = useState(false);

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => setMounted(true), []);

    // ── Tính vị trí fixed — không bao giờ tràn viewport ─────────────────────────
    const calcPosition = () => {
        const el = triggerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const viewport = window.visualViewport;
        const vw = viewport?.width ?? window.innerWidth;
        const vh = viewport?.height ?? window.innerHeight;
        const offsetLeft = viewport?.offsetLeft ?? 0;
        const offsetTop = viewport?.offsetTop ?? 0;

        const maxWidth = Math.max(220, vw - EDGE * 2);
        const dropW = Math.min(Math.max(rect.width, 220), Math.min(DROPDOWN_W, maxWidth));

        let left = rect.left + offsetLeft;
        if (left + dropW > offsetLeft + vw - EDGE) left = rect.right + offsetLeft - dropW;
        if (left < offsetLeft + EDGE) left = offsetLeft + EDGE;

        const estimatedPanelH = Math.min(panelRef.current?.offsetHeight ?? 320, vh - EDGE * 2);
        let top = rect.bottom + offsetTop + GAP;
        if (top + estimatedPanelH > offsetTop + vh - EDGE) {
            top = Math.max(offsetTop + EDGE, rect.top + offsetTop - estimatedPanelH - GAP);
        }

        setDropStyle({
            position: "fixed",
            top,
            left,
            width: dropW,
            zIndex: 9999,
        });
    };

    useEffect(() => {
        if (!open) return;

        calcPosition();
        const rafId = requestAnimationFrame(() => calcPosition());

        window.addEventListener("scroll", calcPosition, true);
        window.addEventListener("resize", calcPosition);
        window.visualViewport?.addEventListener("resize", calcPosition);
        window.visualViewport?.addEventListener("scroll", calcPosition);

        const observer = new ResizeObserver(() => calcPosition());
        if (triggerRef.current) observer.observe(triggerRef.current);
        if (panelRef.current) observer.observe(panelRef.current);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("scroll", calcPosition, true);
            window.removeEventListener("resize", calcPosition);
            window.visualViewport?.removeEventListener("resize", calcPosition);
            window.visualViewport?.removeEventListener("scroll", calcPosition);
            observer.disconnect();
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
            const target = e.target as Node;
            if (wrapRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── ESC close ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

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
        <div className={`relative ${className}`} ref={wrapRef}>
            {/* ── Trigger ─────────────────────────────────────────────────────── */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((v) => !v)}
                className={[
                    // flex w-full → label chiếm hết khoảng giữa, icon luôn ghim phải
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
                {/* Icon trái (tùy chọn) */}
                {icon && <span className="shrink-0 text-gray-400">{icon}</span>}

                {/* Label — co giãn chiếm hết khoảng trống */}
                <span className="flex-1 min-w-0 truncate text-left">
                    {loading ? t("loading") : buttonLabel}
                </span>

                {/* Clear + Chevron — luôn ghim sát phải */}
                <span className="flex items-center gap-1 shrink-0">
                    {hasValue && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            aria-label={t("clearSelection")}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full
                                bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </span>
            </button>

            {/* ── Dropdown (fixed) ─────────────────────────────────────────────── */}
            {open && mounted && createPortal(
                <div
                    ref={panelRef}
                    style={dropStyle}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                        rounded-2xl shadow-xl overflow-hidden"
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
                </div>,
                document.body,
            )}
        </div>
    );
}
