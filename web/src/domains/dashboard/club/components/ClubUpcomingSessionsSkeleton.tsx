"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/shared/ui/Skeleton";

import { DashboardCard } from "./DashboardCard";

function SessionItemSkeleton() {
  return (
    <article className="flex flex-col gap-4 px-4 py-5 sm:px-5 lg:flex-row lg:items-center lg:gap-5">
      {/* Date tile */}
      <Skeleton className="mx-auto h-[72px] w-[72px] shrink-0 rounded-xl sm:mx-0" />

      {/* Main session information */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Title and badges */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-28 max-w-full rounded" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Session date */}
          <div className="flex min-w-0 items-center gap-1.5">
            <Skeleton className="size-3.5 shrink-0 rounded" />
            <Skeleton className="h-3.5 w-32 max-w-full rounded" />
          </div>
        </div>

        {/* Time, location and player count */}
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3.5 shrink-0 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>

          <div className="hidden h-3 w-px bg-border sm:block" />

          <div className="flex min-w-0 items-center gap-1.5">
            <Skeleton className="size-3.5 shrink-0 rounded" />
            <Skeleton className="h-3.5 w-48 max-w-full rounded" />
          </div>

          <div className="hidden h-3 w-px bg-border sm:block" />

          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3.5 shrink-0 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
      </div>

      {/* Financial information */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border pt-3 sm:min-w-[170px] sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0">
        <div className="space-y-2 sm:w-full">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>

        <div className="space-y-2 sm:w-full sm:text-right">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>
    </article>
  );
}

export function ClubUpcomingSessionsSkeleton() {
  const t = useTranslations("clubDashboard");

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("sessions.title")}
    >
      <span className="sr-only">{t("header.loading")}</span>

      <DashboardCard
        icon={CalendarDays}
        title={t("sessions.title")}
        description={t("sessions.description")}
        action={<Skeleton className="h-8 w-28 rounded-lg" />}
      >
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }, (_, index) => (
            <SessionItemSkeleton key={index} />
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}