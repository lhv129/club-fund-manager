// src/components/shared/ui/StatusDropdown.tsx
"use client";

import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/shared/ui/Badge";

export interface StatusOption {
    value: string;
    label: string;
    variant: BadgeVariant | string;
}

interface StatusDropdownProps {
    value: string;
    options: StatusOption[];
    onChange?: (value: string) => void;
    loading?: boolean;
    disabled?: boolean;
    showDot?: boolean;
}

export function StatusDropdown({
    value,
    options,
    onChange,
    loading = false,
    disabled = false,
    showDot = true,
}: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const [dropStyle, setDropStyle] = useState<CSSProperties>({});

    // triggerRef: nút badge — để tính toạ độ
    const triggerRef = useRef<HTMLButtonElement>(null);
    // panelRef: panel popup — để click-outside phân biệt trigger vs panel
    const panelRef = useRef<HTMLDivElement>(null);

    const isInteractive = !!onChange && !disabled && !loading;

    const currentOption =
        options.find((o) => o.value === value) ?? { value, label: value, variant: "inactive" };

    // ── Tính vị trí panel (fixed so với viewport) ────────────────────────────
    const calcPosition = () => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const PANEL = 200;
        const PANEL_MAX_H = 240;

        // Ưu tiên mở xuống, nếu không đủ chỗ thì mở lên
        const spaceBelow = vh - rect.bottom - 4;
        const spaceAbove = rect.top - 4;
        const openUp = spaceBelow < PANEL_MAX_H && spaceAbove > spaceBelow;

        let left = rect.left;
        if (left + PANEL > vw - 8) left = rect.right - PANEL;
        if (left < 8) left = 8;

        setDropStyle({
            position: "fixed",
            left,
            width: PANEL,
            zIndex: 9999,
            ...(openUp
                ? { bottom: vh - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        });
    };

    // Tính lại ngay khi mở, và theo dõi scroll/resize
    useEffect(() => {
        if (!open) return;
        calcPosition();

        // capture:true để bắt cả scroll bên trong overflow container
        window.addEventListener("scroll", calcPosition, true);
        window.addEventListener("resize", calcPosition);
        return () => {
            window.removeEventListener("scroll", calcPosition, true);
            window.removeEventListener("resize", calcPosition);
        };
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Click outside — kiểm tra cả trigger lẫn panel ───────────────────────
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            const inTrigger = triggerRef.current?.contains(target);
            const inPanel = panelRef.current?.contains(target);
            if (!inTrigger && !inPanel) {
                setOpen(false);
            }
        };
        // mousedown để đóng trước khi click item (nếu cần)
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleSelect = (val: string) => {
        if (val !== value) onChange?.(val);
        setOpen(false);
    };

    // ── READONLY ──────────────────────────────────────────────────────────────
    if (!onChange) {
        return (
            <Badge
                variant={currentOption.variant as BadgeVariant}
                title={currentOption.label}
                showDot={showDot}
            />
        );
    }

    // ── INTERACTIVE ───────────────────────────────────────────────────────────
    return (
        <>
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

                {isInteractive && (
                    <ChevronDown
                        className={`w-3 h-3 text-foreground-muted transition-transform duration-150 ${open ? "rotate-180" : ""
                            }`}
                    />
                )}
            </button>

            {/* ── Panel — portal ra body, không bị ảnh hưởng bởi overflow/stacking ── */}
            {open &&
                createPortal(
                    <div
                        ref={panelRef}
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
                                    onMouseDown={(e) => {
                                        // ngăn trigger blur/mousedown của document
                                        e.preventDefault();
                                        handleSelect(opt.value);
                                    }}
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
                    </div>,
                    document.body
                )}
        </>
    );
}