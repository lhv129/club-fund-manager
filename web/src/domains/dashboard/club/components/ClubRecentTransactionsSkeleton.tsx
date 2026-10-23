"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/shared/ui/Skeleton";

export function ClubRecentTransactionsSkeleton() {
    const t = useTranslations("clubDashboard");
    const columnWidths = ["w-24", "w-20", "w-16", "w-20"];

    return (
        <section
            role="status"
            aria-busy="true"
            aria-label={t("header.loading")}
            className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
        >
            <span className="sr-only">{t("header.loading")}</span>

            <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <Skeleton className="size-10 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-5 w-44 max-w-full rounded" />
                            <Skeleton className="h-3 w-60 max-w-full rounded" />
                        </div>
                    </div>

                    <div aria-hidden="true" className="flex shrink-0 items-center gap-2">
                        <Skeleton className="h-4 w-12 rounded" />
                        <Skeleton className="size-4 rounded" />
                    </div>
                </div>

                <div className="mt-5 hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(100px,1fr)] gap-4 border-b border-border px-4 py-3 lg:grid">
                    {columnWidths.map((width, index) => (
                        <Skeleton key={index} className={"h-3 rounded " + width} />
                    ))}
                </div>

                <div className="mt-4 space-y-3 lg:mt-0 lg:space-y-0">
                    {Array.from({ length: 5 }, (_, index) => (
                        <article
                            key={index}
                            className="flex flex-col gap-3 rounded-xl border border-border/60 p-3.5 sm:p-4 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(100px,1fr)] lg:items-center lg:gap-4 lg:rounded-none lg:border-0 lg:border-b lg:border-border/60 lg:px-4"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <Skeleton className="size-10 shrink-0 rounded-xl" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-36 max-w-full rounded" />
                                    <Skeleton className="h-3 w-24 max-w-full rounded" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 lg:block">
                                <Skeleton className="h-3 w-16 rounded lg:hidden" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>

                            <div className="flex items-center justify-between gap-3 lg:block">
                                <Skeleton className="h-3 w-12 rounded lg:hidden" />
                                <Skeleton className="h-3 w-28 max-w-full rounded" />
                            </div>

                            <div className="flex items-center justify-between gap-3 lg:justify-end">
                                <Skeleton className="h-3 w-14 rounded lg:hidden" />
                                <Skeleton className="h-5 w-28 rounded" />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}