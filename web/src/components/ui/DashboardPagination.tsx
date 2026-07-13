"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardPaginationProps {
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

export function DashboardPagination({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
    limitOptions = [10, 20, 50, 100],
    className = "",
}: DashboardPaginationProps) {
    const t = useTranslations("common");

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    const pageNumbers = getPageNumbers(page, totalPages);

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${className}`}>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>
                    {total === 0 ? t("noResults") : t("showingResults", { from, to, total })}
                </span>

                {onLimitChange && (
                    <select
                        value={limit}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={t("previous")}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((p, i) =>
                    p === "…" ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p as number)}
                            className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${p === page
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={t("next")}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}