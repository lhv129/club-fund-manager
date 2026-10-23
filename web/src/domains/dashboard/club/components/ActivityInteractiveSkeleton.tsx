"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/shared/ui/Skeleton";

export function ActivityInteractiveSkeleton() {
  const t = useTranslations("clubDashboard");

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
              <Skeleton className="h-5 w-40 max-w-full rounded" />
              <Skeleton className="h-3 w-64 max-w-full rounded" />
            </div>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-xl bg-background-subtle/55 p-3.5 sm:p-4">
              <Skeleton className="h-3 w-24 max-w-full rounded" />
              <Skeleton className="mt-2 h-7 w-16 rounded" />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          ))}
        </div>

        <div className="mt-4 h-[260px] sm:h-[320px] lg:h-[360px]">
          <div className="flex h-full gap-3">
            <div className="flex w-10 shrink-0 flex-col justify-between py-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-2.5 w-8 rounded" />
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <div className="absolute inset-0 flex flex-col justify-between py-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-px w-full bg-border/70" />
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex translate-y-5 justify-between">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-2.5 w-7 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}