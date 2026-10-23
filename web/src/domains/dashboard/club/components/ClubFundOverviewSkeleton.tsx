"use client";

import { CircleDollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/shared/ui/Skeleton";
import { DashboardCard } from "./DashboardCard";

type ClubFundOverviewSkeletonProps = {
    periodCount?: number;
    title?: string;
    description?: string;
};

export function ClubFundOverviewSkeleton({
    periodCount = 3,
    title,
    description,
}: ClubFundOverviewSkeletonProps) {
    const t = useTranslations("clubDashboard");
    const safePeriodCount = Math.max(1, Math.floor(periodCount));

    return (
        <div
            role="status"
            aria-busy="true"
            aria-label={title ?? t("fund.title")}
        >
            <span className="sr-only">{t("header.loading")}</span>

            <DashboardCard
                icon={CircleDollarSign}
                title={title ?? t("fund.title")}
                description={description ?? t("fund.description")}
                action={
                    <span aria-hidden="true" className="inline-flex items-center gap-2">
                        <Skeleton className="h-4 w-14 rounded" />
                        <Skeleton className="size-4 rounded" />
                    </span>
                }
            >
                <div className="grid gap-3">
                    {Array.from({ length: safePeriodCount }, (_, index) => (
                        <article
                            key={index}
                            aria-hidden="true"
                            className="flex flex-col gap-4 rounded-2xl p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-5"
                        >
                            <div className="flex shrink-0 items-center lg:w-[78px] lg:items-start">
                                <Skeleton className="h-[92px] w-[78px] shrink-0 rounded-2xl" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-4 w-40 max-w-full rounded" />
                                        <div className="flex items-center gap-1.5">
                                            <Skeleton className="size-3.5 shrink-0 rounded-full" />
                                            <Skeleton className="h-3 w-28 max-w-full rounded" />
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                </div>

                                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <Skeleton className="h-3 w-12 rounded" />
                                        <Skeleton className="h-3 w-6 rounded" />
                                    </div>
                                    <Skeleton className="size-1 rounded-full" />
                                    <div className="flex items-center gap-1.5">
                                        <Skeleton className="h-3 w-16 rounded" />
                                        <Skeleton className="h-3 w-6 rounded" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-between gap-4 pt-1 sm:min-w-[220px] sm:justify-end sm:pt-0 sm:text-right">
                                <div className="w-full space-y-2 sm:text-right">
                                    <Skeleton className="h-3 w-20 sm:ml-auto" />
                                    <Skeleton className="h-5 w-32 max-w-full sm:ml-auto" />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </DashboardCard>
        </div>
    );
}