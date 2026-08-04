"use client";

import { useTranslations } from "next-intl";
import { Loader2, ChevronDown } from "lucide-react";

interface CursorMeta {
    limit: number;
    has_more: boolean;
    next_cursor: string | null;
    prev_cursor: string | null;
}

interface CursorLoadMoreProps {
    meta: CursorMeta | undefined;
    totalLoaded: number;
    onLoadMore: () => void;
    loading?: boolean;
    className?: string;
}

export function CursorLoadMore({
    meta,
    totalLoaded,
    onLoadMore,
    loading = false,
    className = "",
}: CursorLoadMoreProps) {
    const t = useTranslations("common");

    if (!meta) return null;

    return (
        <div className={`flex flex-col items-center gap-3 py-4 ${className}`}>
            {/* Số lượng đang hiển thị */}
            {totalLoaded > 0 && (
                <p className="text-sm text-foreground-muted">
                    {t("showing")}{" "}
                    <span className="font-medium text-foreground tabular-nums">
                        {totalLoaded}
                    </span>{" "}
                    {t("items")}
                </p>
            )}

            {/* Nút Load More */}
            {meta.has_more ? (
                <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loading}
                    className="
                        inline-flex items-center gap-2
                        rounded-xl border border-border
                        bg-background px-5 py-2.5
                        text-sm font-medium text-foreground
                        transition-all duration-150
                        hover:bg-background-subtle
                        hover:border-border-strong
                        active:scale-95
                        disabled:pointer-events-none
                        disabled:opacity-50
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-primary/40
                    "
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}

                    {loading ? t("loading") : t("loadMore")}
                </button>
            ) : (
                totalLoaded > 0 && (
                    <p className="text-xs text-foreground-muted">
                        {t("allLoaded")}
                    </p>
                )
            )}
        </div>
    );
}