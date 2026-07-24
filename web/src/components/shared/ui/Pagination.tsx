"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
    className?: string;
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
    const delta = 1;
    const range: (number | "…")[] = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);
    if (left > 2) range.push("…");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push("…");
    if (total > 1) range.push(total);

    return range;
}

export function Pagination({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
    limitOptions = [10, 20, 50, 100],
    className = "",
}: PaginationProps) {
    const t = useTranslations("common");

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    const pageNumbers = getPageNumbers(page, totalPages);

    const navBtnCls = `inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border
        text-foreground-muted transition-all duration-150
        hover:bg-background-subtle hover:text-foreground hover:border-border-strong
        active:scale-95
        disabled:opacity-40 disabled:pointer-events-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`;

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${className}`}>
            <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <span className="tabular-nums">
                    {total === 0 ? t("noResults") : t("showingResults", { from, to, total })}
                </span>

                {onLimitChange && (
                    <select
                        value={limit}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-background
                            text-xs font-medium text-foreground cursor-pointer
                            hover:border-border-strong transition-colors
                            focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                        {limitOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt} / {t("page").toLowerCase()}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className={navBtnCls}
                    aria-label={t("previous")}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((p, i) =>
                    p === "…" ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="px-1.5 text-sm text-foreground-muted select-none"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p as number)}
                            aria-current={p === page ? "page" : undefined}
                            className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium tabular-nums
                                transition-all duration-150 active:scale-95
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                                ${p === page
                                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                                    : "text-foreground-muted hover:bg-background-subtle hover:text-foreground"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className={navBtnCls}
                    aria-label={t("next")}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
