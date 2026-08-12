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
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, "…", total - 1, total];
    if (current >= total - 3) return [1, 2, "…", total - 3, total - 2, total - 1, total];
    return [1, "…", current - 1, current, current + 1, "…", total];
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

    const navBtnCls = `inline-flex h-8 w-8 items-center justify-center rounded-lg
        text-foreground-muted transition-all duration-150
        hover:bg-background-subtle hover:text-foreground
        active:scale-95
        disabled:opacity-40 disabled:pointer-events-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`;

    return (
        <div className={`relative z-10 !mt-0 flex flex-col gap-2 rounded-b-2xl border border-t border-border bg-background px-4 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 ${className}`}>
            <div className="text-[10px] leading-4 text-foreground-muted">
                <span className="tabular-nums">
                    {total === 0 ? t("noResults") : t("showingResults", { from, to, total })}
                </span>
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-start gap-0.5 sm:justify-end sm:gap-1">
                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className={navBtnCls}
                    aria-label={t("previous")}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {pageNumbers.map((p, i) =>
                    p === "…" ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="min-w-6 select-none px-0.5 text-center text-[9px] text-foreground-muted"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p as number)}
                            aria-current={p === page ? "page" : undefined}
                            className={`h-8 min-w-8 rounded-lg px-1.5 text-[10px] font-medium tabular-nums
                                transition-all duration-150 active:scale-95
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                                ${p === page
                                    ? "bg-primary/10 text-primary shadow-sm"
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
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>

                {onLimitChange && (
                    <div className="relative ml-2 shrink-0 sm:ml-3">
                        <select
                            aria-label={t("itemsPerPage")}
                            value={limit}
                            onChange={(e) => onLimitChange(Number(e.target.value))}
                            className="h-8 max-w-40 appearance-none rounded-lg border border-border bg-background py-1.5 pl-2.5 pr-7 text-[10px] font-medium text-foreground transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            {limitOptions.map((opt) => (
                                <option key={opt} value={opt}>{t("itemsPerPage")}: {opt}</option>
                            ))}
                        </select>
                        <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-foreground-muted" />
                    </div>
                )}
            </div>
        </div>
    );
}
