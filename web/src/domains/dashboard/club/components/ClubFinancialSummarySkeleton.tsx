"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/shared/ui/Skeleton";

export function ClubFinancialSummarySkeleton() {
    const t = useTranslations("clubDashboard");

    return (
        <section
            role="status"
            aria-busy="true"
            aria-label={t("financial.title")}
            className="space-y-3.5"
        >
            <span className="sr-only">{t("header.loading")}</span>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <article
                        key={index}
                        aria-hidden="true"
                        className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-5"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <Skeleton className="h-4 w-28 rounded" />
                                <div className="mt-1.5 min-h-8 space-y-1">
                                    <Skeleton className="h-3 w-36 max-w-full rounded" />
                                    <Skeleton className="h-3 w-24 max-w-full rounded" />
                                </div>
                            </div>

                            <Skeleton className="size-10 shrink-0 rounded-xl" />
                        </div>

                        <Skeleton className="mt-5 h-8 w-40 max-w-full rounded sm:h-9" />
                    </article>
                ))}
            </div>
        </section>
    );
}