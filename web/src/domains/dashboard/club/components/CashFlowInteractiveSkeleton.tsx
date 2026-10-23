"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/shared/ui/Skeleton";

export function CashFlowInteractiveSkeleton() {
  const t = useTranslations("clubDashboard");

  return (
    <section
      role="status"
      aria-busy="true"
      aria-label={t("header.loading")}
      className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
    >
      <span className="sr-only">{t("header.loading")}</span>

      <div className="flex items-start gap-3 p-5 sm:p-6">
        <Skeleton className="size-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40 max-w-full rounded" />
          <Skeleton className="h-3 w-64 max-w-full rounded" />
        </div>
      </div>

      <div className="px-4 pb-2 pt-4 sm:px-6">
        <div className="flex flex-col gap-3 rounded-xl bg-background-subtle/45 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full max-w-lg rounded" />
              <Skeleton className="h-3 w-3/4 max-w-md rounded" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            {[
              "w-12",
              "w-14",
              "w-10",
            ].map((width, index) => (
              <div key={index} className="flex h-8 items-center gap-2 rounded-full bg-background-subtle/70 px-3">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className={"h-3 rounded " + width} />
              </div>
            ))}
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 px-4 py-2 sm:grid-cols-3 sm:px-6">
        {[
          "w-16",
          "w-20",
          "w-24",
        ].map((width, index) => (
          <div key={index} className="min-w-0 rounded-xl bg-background-subtle/55 px-3.5 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <Skeleton className={"h-3 rounded " + width} />
              </div>
              <Skeleton className="h-0.5 w-5 shrink-0 rounded-full" />
            </div>
            <Skeleton className={"mt-2 h-6 max-w-full rounded sm:h-7 " + (index === 0 ? "w-32" : index === 1 ? "w-28" : "w-36")} />
          </div>
        ))}
      </div>

      <div className="w-full px-2 pb-2 pt-4 sm:px-6 sm:pt-5">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <Skeleton className="h-3 w-52 max-w-[65%] rounded" />
          <Skeleton className="h-3 w-20 shrink-0 rounded" />
        </div>

        <div className="h-[300px] sm:h-[350px] lg:h-[390px]">
          <div className="flex h-full">
            <div className="flex w-12 shrink-0 flex-col justify-between py-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-2.5 w-8 rounded" />
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <div className="absolute inset-0 flex flex-col justify-between py-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-px w-full bg-border/70" />
                ))}
              </div>

              <svg
                aria-hidden="true"
                viewBox="0 0 600 260"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full overflow-visible"
              >
                <path d="M0 205 C35 190 55 215 95 170 S150 150 185 175 S245 95 285 125 S345 145 385 85 S445 115 480 65 S545 95 600 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-muted-foreground/30" />
                <path d="M0 85 C45 105 65 70 105 115 S170 175 210 135 S270 190 315 155 S375 205 420 170 S485 215 530 180 S570 195 600 165" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-muted-foreground/20" />
                <path d="M0 230 C50 210 75 225 120 195 S185 210 225 185 S290 210 330 170 S390 190 430 145 S500 165 545 125 S580 140 600 105" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground/25" />
              </svg>

              <div className="absolute inset-x-0 bottom-0 flex translate-y-5 justify-between gap-2 px-1">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-2.5 w-7 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 flex h-6 items-center gap-2 rounded bg-background-subtle/30 px-2">
          <Skeleton className="h-3 w-2 rounded-sm" />
          <Skeleton className="h-2 flex-1 rounded" />
          <Skeleton className="h-3 w-2 rounded-sm" />
        </div>
      </div>
    </section>
  );
}