// src/components/shared/ui/StatusDropdown.tsx
//
// Ba chế độ dùng:
//
// 1. Interactive — click Badge → mini popup → chọn → gọi API:
//    <StatusDropdown value={row.status} options={statusOptions} onChange={handleChange} />
//
// 2. Readonly — chỉ hiển thị Badge, không click được:
//    <StatusDropdown value={row.status} options={statusOptions} />
//
// 3. Loading — đang gọi API, hiện spinner trên Badge:
//    <StatusDropdown value={row.status} options={statusOptions} onChange={...} loading />
"use client";

import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/shared/ui/Badge";

export interface StatusOption {
    value: string;
    label: string;
    /** Key màu cho Badge — dùng BadgeVariant hoặc string (sẽ fallback về gray) */
    variant: BadgeVariant | string;
}

interface StatusDropdownProps {
    /** Giá trị hiện tại */
    value: string;
    /** Danh sách lựa chọn */
    options: StatusOption[];
    /**
     * Nếu có → interactive: click mở dropdown, chọn gọi onChange(newValue).
     * Nếu không có → readonly: chỉ hiển thị Badge.
     */
    onChange?: (value: string) => void;
    /** Đang xử lý API → hiện spinner, disable tương tác */
    loading?: boolean;
    /** Disable toàn bộ (dù có onChange) */
    disabled?: boolean;
}

export function StatusDropdown({
    value,
    options,
    onChange,
    loading = false,
    disabled = false,
}: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const [dropStyle, setDropStyle] = useState<CSSProperties>({});

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const isInteractive = !!onChange && !disabled && !loading;

    const currentOption =
        options.find((o) => o.value === value) ?? { value, label: value, variant: "inactive" };

    // ── Fixed position — không tràn viewport ─────────────────────────────────────
    const calcPosition = () => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const PANEL = 200;

        let left = rect.left;
        if (left + PANEL > vw - 8) left = rect.right - PANEL;
        if (left < 8) left = 8;

        setDropStyle({
            position: "fixed",
            top: rect.bottom + 4,
            left,
            width: PANEL,
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
        if (!open) return;
        const handler = (e: globalThis.MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleSelect = (val: string) => {
        if (val === value) { setOpen(false); return; }
        onChange?.(val);
        setOpen(false);
    };

    // ── READONLY — chỉ Badge, không có trigger ────────────────────────────────────
    if (!onChange) {
        return (
            <Badge
                variant={currentOption.variant as BadgeVariant}
                title={currentOption.label}
            />
        );
    }

    // ── INTERACTIVE ───────────────────────────────────────────────────────────────
    return (
        <div className="relative inline-flex" ref={wrapRef}>
            <button
                ref={triggerRef}
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && setOpen((v) => !v)}
                className={[
                    "inline-flex items-center gap-1 rounded-full transition-all",
                    isInteractive
                        ? "cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-offset-1 hover:ring-offset-background hover:ring-border-strong"
                        : "cursor-default",
                ].join(" ")}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {/* Badge với spinner overlay khi loading */}
                <span className="relative inline-flex items-center">
                    <Badge
                        variant={currentOption.variant as BadgeVariant}
                        title={loading ? "…" : currentOption.label}
                    />
                    {loading && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                            <Loader2 className="w-3 h-3 animate-spin text-foreground-muted" />
                        </span>
                    )}
                </span>

                {/* Chevron nhỏ — chỉ khi interactive */}
                {isInteractive && (
                    <ChevronDown
                        className={`w-3 h-3 text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`}
                    />
                )}
            </button>

            {/* ── Mini dropdown panel ──────────────────────────────────────────── */}
            {open && (
                <div
                    style={dropStyle}
                    role="listbox"
                    className="bg-background border border-border
                        rounded-xl shadow-xl overflow-hidden py-1
                        animate-in fade-in zoom-in-95 duration-150"
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleSelect(opt.value)}
                                className={[
                                    "w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors",
                                    isSelected
                                        ? "bg-background-subtle"
                                        : "hover:bg-background-subtle",
                                ].join(" ")}
                            >
                                <Badge
                                    variant={opt.variant as BadgeVariant}
                                    title={opt.label}
                                />
                                {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
