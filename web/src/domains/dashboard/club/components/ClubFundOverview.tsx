"use client";

import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { CLUB_SUBROUTES, clubRoute } from "@/constants";
import { Link } from "@/i18n/routing";
import { formatAmount } from "@/utils";
import { Badge } from "@/components/shared/ui/Badge";
import { FundPeriodDate } from "@/components/shared/ui/FundPeriodDate";

import type {
  DashboardFundPeriod,
} from "../types";

import {
  DashboardCard,
  DashboardState,
} from "./DashboardCard";
import { ClubFundOverviewSkeleton } from "./ClubFundOverviewSkeleton";

type DashboardPeriod =
  | "month"
  | "previous_month"
  | "3m"
  | "6m"
  | "this_year"
  | "last_year"
  | "custom";

type ClubFundOverviewProps = {
  periods: DashboardFundPeriod[];
  locale: string;
  slug: string;
  period?: DashboardPeriod;
  isLoading?: boolean;
};

export function ClubFundOverview({
  periods,
  locale,
  slug,
  period = "month",
  isLoading = false,
}: ClubFundOverviewProps) {
  const t = useTranslations("clubDashboard");

  const sortedPeriods = [...periods].sort(
    (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month),
  );

  const activeIndex = sortedPeriods.findIndex((item) => item.is_active);
  const currentPeriod =
    (activeIndex >= 0 ? sortedPeriods[activeIndex] : sortedPeriods[0]) ?? null;

  const previousPeriod =
    (activeIndex >= 0
      ? sortedPeriods.slice(activeIndex + 1).find((item) => !item.is_active)
      : sortedPeriods.find((item) => !item.is_active)) ?? null;

  const selectedPeriod =
    period === "previous_month" ? previousPeriod : currentPeriod;

  const displayPeriods =
    period === "month" || period === "previous_month"
      ? selectedPeriod
        ? [selectedPeriod]
        : []
      : sortedPeriods;

  const titlePeriod =
    period === "month" || period === "previous_month"
      ? selectedPeriod
      : null;

  const title = titlePeriod
    ? t("fund.fundPeriod", {
      month: titlePeriod.month,
      year: titlePeriod.year,
    })
    : t("fund.title");

  const description =
    period === "month" || period === "previous_month"
      ? t("fund.description")
      : getPeriodDescription(period, t);

  if (isLoading) {
    return (
      <ClubFundOverviewSkeleton
        periodCount={
          period === "month" || period === "previous_month" ? 1 : 3
        }
        title={title}
        description={description}
      />
    );
  }

  return (
    <DashboardCard
      icon={CircleDollarSign}
      title={title}
      description={description}
      action={
        <Link
          href={clubRoute(slug, CLUB_SUBROUTES.monthlyContributions)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          {t("common.details")}
          <ArrowRight className="size-4" />
        </Link>
      }
    >
      {!displayPeriods.length ? (
        <DashboardState message={t("fund.noFundPeriod")} />
      ) : (
        <div className="grid gap-3">
          {displayPeriods.map((fundPeriod) => (
            <FundPeriodItem
              key={fundPeriod.period_id}
              period={fundPeriod}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

function FundPeriodItem({
  period,
  locale,
  t,
}: {
  period: DashboardFundPeriod;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <article className="group flex flex-col gap-4 rounded-2xl p-4 transition-colors duration-200 hover:bg-background-subtle/80 sm:p-5 lg:flex-row lg:items-center lg:gap-5">
      <FundPeriodDate period={period} locale={locale} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-foreground sm:text-base">
              {t("fund.fundPeriod", {
                month: period.month,
                year: period.year,
              })}
            </h3>

            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-foreground-muted">
              <CalendarDays className="size-3.5 shrink-0" />
              <span className="truncate">
                {period.is_active
                  ? t("fund.currentPeriod")
                  : t("fund.period")}
              </span>
            </p>
          </div>

          <FundPeriodStatus period={period} t={t} />
        </div>

        <FundPeriodMeta period={period} t={t} />
      </div>

      <FundPeriodPaid period={period} locale={locale} t={t} />
    </article>
  );
}

function FundPeriodMeta({
  period,
  t,
}: {
  period: DashboardFundPeriod;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground-muted">
      <FundCountMeta label={t("fund.paid")} count={period.paid_count} />
      <span aria-hidden="true" className="size-1 rounded-full bg-foreground-muted/40" />
      <FundCountMeta label={t("fund.pending")} count={period.pending_count} />
    </div>
  );
}

function FundCountMeta({
  label,
  count,
}: {
  label: string;
  count: number | string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}:</span>
      <span className="font-semibold tabular-nums text-foreground">
        {Number(count)}
      </span>
    </span>
  );
}

function FundPeriodPaid({
  period,
  locale,
  t,
}: {
  period: DashboardFundPeriod;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 pt-1 sm:min-w-[220px] sm:justify-end sm:pt-0 sm:text-right">
      <div className="min-w-0 sm:w-full">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("fund.paid")}
        </p>
        <p className="mt-1 text-base font-bold tabular-nums text-foreground">
          {formatAmount(Number(period.total_paid), "₫", locale)}
        </p>
      </div>
    </div>
  );
}

function FundPeriodStatus({
  period,
  t,
}: {
  period: DashboardFundPeriod;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {period.is_active ? <Badge variant="active" title={t("fund.active")} /> : null}
      {period.is_locked ? <Badge variant="locked" title={t("fund.locked")} /> : null}
      {!period.is_active && !period.is_locked ? (
        <Badge variant="inactive" title={t("fund.inactive")} />
      ) : null}
    </div>
  );
}

function getPeriodDescription(
  period: DashboardPeriod,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (period) {
    case "3m":
      return t("fund.last3Months");
    case "6m":
      return t("fund.last6Months");
    case "this_year":
      return t("fund.thisYear");
    case "last_year":
      return t("fund.lastYear");
    case "custom":
      return t("fund.customPeriod");
    default:
      return t("fund.overviewDescription");
  }
}