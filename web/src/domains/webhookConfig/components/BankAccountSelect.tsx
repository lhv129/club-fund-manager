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
import { Check, ChevronDown, Landmark, Search, Star, X } from "lucide-react";

import type { BankAccount } from "@/domains/bankAccount/types";
import CustomImage from "@/components/shared/media/CustomImage";

type Props = {
    label: string;
    accounts: BankAccount[];
    value: string;
    onChange: (value: string) => void;
    onSearch?: (search: string) => void;
    loading?: boolean;
    disabled?: boolean;
    error?: boolean;
    placeholder?: string;
    className?: string;
};

const DROPDOWN_MIN_W = 320;
const EDGE = 8;
const GAP = 6;

const GRADIENTS = [
    "from-indigo-500 to-violet-500",
    "from-sky-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-fuchsia-500 to-purple-500",
];

function bankLabel(account: BankAccount) {
    return account.bank?.short_name || account.bank?.name || account.bank?.code || "";
}

function initials(account: BankAccount) {
    const base = account.bank?.short_name || account.bank?.code || account.bank?.name || "?";
    return base.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "?";
}

function BankAvatar({
    account,
    size = 40,
}: {
    account: BankAccount;
    size?: number;
}) {
    const gradient =
        GRADIENTS[(account.bank_id ?? account.id ?? 0) % GRADIENTS.length];

    const style = {
        width: size,
        height: size,
    };

    if (account.bank?.logo) {
        return (
            <span
                style={style}
                className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200/70 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
                <CustomImage
                    src={account.bank.logo}
                    alt={bankLabel(account)}
                    className="h-full w-full object-contain p-1"
                />
            </span>
        );
    }

    return (
        <span
            style={style}
            className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-[11px] font-bold tracking-wide text-white shadow-sm`}
        >
            {initials(account)}
        </span>
    );
}

export default function BankAccountSelect({
    label,
    accounts,
    value,
    onChange,
    onSearch,
    loading = false,
    disabled = false,
    error = false,
    placeholder,
    className = "",
}: Props) {
    const t = useTranslations("common");
    const tw = useTranslations("webhookConfig");

    const [open, setOpen] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [dropStyle, setDropStyle] = useState<CSSProperties | null>(null);
    const [dropReady, setDropReady] = useState(false);
    const [mounted, setMounted] = useState(false);

    const wrapRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => setMounted(true), []);

    const selected = useMemo(
        () => accounts.find((account) => String(account.id) === value) ?? null,
        [accounts, value],
    );

    const filtered = useMemo(() => {
        const query = keyword.trim().toLowerCase();
        if (!query) return accounts;
        return accounts.filter((account) =>
            `${bankLabel(account)} ${account.bank?.name ?? ""} ${account.account_number} ${account.account_name}`
                .toLowerCase()
                .includes(query),
        );
    }, [keyword, accounts]);

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

        const estimatedHeight = Math.min(
            panelRef.current?.offsetHeight ?? 360,
            viewportHeight - EDGE * 2,
        );
        let top = rect.bottom + offsetTop + GAP;
        if (top + estimatedHeight > offsetTop + viewportHeight - EDGE) {
            top = Math.max(offsetTop + EDGE, rect.top + offsetTop - estimatedHeight - GAP);
        }
        setDropStyle({ position: "fixed", top, left, width: dropWidth, zIndex: 9999 });
    };

    useEffect(() => {
        if (!open) {
            setDropReady(false);
            setDropStyle(null);
            setKeyword("");
            onSearch?.("");
            return;
        }

        setDropReady(false);
        calcPosition();
        const rafId = requestAnimationFrame(() => {
            calcPosition();
            setDropReady(true);
            searchRef.current?.focus();
        });

        const handleScroll = (event: Event) => {
            const target = event.target as Node | null;
            if (target && (panelRef.current?.contains(target) || wrapRef.current?.contains(target))) return;
            setOpen(false);
        };
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", calcPosition);
        window.visualViewport?.addEventListener("resize", calcPosition);

        const observer = new ResizeObserver(() => calcPosition());
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
        if (!open) return;
        const timeoutId = window.setTimeout(() => {
            onSearch?.(keyword.trim());
        }, 250);
        return () => window.clearTimeout(timeoutId);
    }, [keyword, open, onSearch]);

    useEffect(() => {
        const handler = (event: globalThis.MouseEvent) => {
            const target = event.target as Node;
            if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
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

    const handleSelect = (id: number) => {
        onChange(String(id));
        setOpen(false);
    };

    const handleClear = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onChange("");
    };

    const hasValue = Boolean(value && selected);

    return (
        <div className={`relative ${className}`} ref={wrapRef}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((current) => !current)}
                data-testid="bank-account-select-trigger"
                className={[
                    "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:shadow-sm",
                    error
                        ? "border-rose-400 ring-1 ring-rose-200 dark:ring-rose-500/30"
                        : open
                            ? "border-indigo-500 ring-2 ring-indigo-500/25 dark:border-indigo-400"
                            : hasValue
                                ? "border-indigo-200 bg-indigo-50/40 dark:border-indigo-500/40 dark:bg-indigo-500/5"
                                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900",
                ].join(" ")}
            >
                {hasValue && selected ? (
                    <>
                        <BankAvatar account={selected} size={40} />
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                    {bankLabel(selected)}
                                </span>
                                {selected.is_default && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                        <Star className="h-2.5 w-2.5 fill-current" />
                                        {tw("default")}
                                    </span>
                                )}
                            </span>
                            <span className="truncate font-mono text-xs tracking-wide text-gray-500 dark:text-gray-400">
                                {selected.account_number} · {selected.account_name}
                            </span>
                        </span>
                    </>
                ) : (
                    <>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                            <Landmark className="h-5 w-5" />
                        </span>
                        <span className="flex-1 truncate text-sm text-gray-400">
                            {loading ? t("loading") : placeholder ?? tw("selectBankAccount")}
                        </span>
                    </>
                )}

                <span className="flex shrink-0 items-center gap-1 text-gray-400">
                    {hasValue && !disabled && (
                        <span
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={handleClear}
                            aria-label={t("clearSelection")}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
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
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900"
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 pb-2.5 pt-3 dark:border-gray-800">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                            {hasValue && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                    className="text-xs font-medium text-gray-400 transition-colors hover:text-rose-500"
                                >
                                    {t("clearSelection")}
                                </button>
                            )}
                        </div>

                        <div className="border-b border-gray-100 p-3 dark:border-gray-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    value={keyword}
                                    onChange={(event) => setKeyword(event.target.value)}
                                    placeholder={tw("searchBankPlaceholder")}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-2 p-3">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                            <div className="h-2.5 w-36 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="px-3 py-8 text-center text-xs italic text-gray-400">
                                {t("noOptionsFound")}
                            </p>
                        ) : (
                            <div className="max-h-72 overflow-y-auto p-1.5">
                                {filtered.map((account) => {
                                    const isSelected = String(account.id) === value;
                                    return (
                                        <button
                                            key={account.id}
                                            type="button"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => handleSelect(account.id)}
                                            data-testid={`bank-account-option-${account.id}`}
                                            className={[
                                                "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                                                isSelected ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-800",
                                            ].join(" ")}
                                        >
                                            <BankAvatar account={account} size={40} />
                                            <span className="flex min-w-0 flex-1 flex-col">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                        {bankLabel(account)}
                                                    </span>
                                                    {account.is_default && (
                                                        <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                                                    )}
                                                </span>
                                                <span className="truncate font-mono text-xs tracking-wide text-gray-500 dark:text-gray-400">
                                                    {account.account_number}
                                                </span>
                                                <span className="truncate text-xs text-gray-400">{account.account_name}</span>
                                            </span>
                                            <span
                                                className={[
                                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                                    isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 dark:border-gray-600",
                                                ].join(" ")}
                                            >
                                                {isSelected && <Check className="h-3 w-3 text-white" />}
                                            </span>
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