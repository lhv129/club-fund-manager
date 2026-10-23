"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/shared/ui/Skeleton";

export function DashboardInsightsChartsSkeleton() {
  const t = useTranslations("clubDashboard");
  const legendWidths = ["w-28", "w-24", "w-32", "w-20"];

  return (
    <section
      role="status"
      aria-busy="true"
      aria-label={t("header.loading")}
      className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
    >
      <span className="sr-only">{t("header.loading")}</span>

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-44 max-w-full rounded" />
            <Skeleton className="h-3 w-60 max-w-full rounded" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 justify-center sm:w-1/2">
            <div className="relative size-44 sm:size-48">
              <Skeleton className="size-full rounded-full" />
              <div className="absolute inset-[24%] rounded-full bg-background" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="space-y-2 text-center">
                  <Skeleton className="mx-auto h-3 w-12 rounded" />
                  <Skeleton className="mx-auto h-5 w-16 rounded" />
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            {legendWidths.map((width, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Skeleton className="size-3 shrink-0 rounded-sm" />
                  <Skeleton className={"h-3 max-w-full rounded " + width} />
                </div>
                <Skeleton className="h-3 w-10 shrink-0 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20 max-w-full rounded" />
              <Skeleton className="h-5 w-24 max-w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}