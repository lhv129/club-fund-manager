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

import type {
  DashboardFundBalance,
  DashboardFundPeriod,
} from "../types";

import {
  DashboardCard,
  DashboardState,
} from "./DashboardCard";

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
};

export function ClubFundOverview({
  periods,
  locale,
  slug,
  period = "month",
}: ClubFundOverviewProps) {
  const t = useTranslations("clubDashboard");

  const sortedPeriods = [...periods].sort(
    (a, b) =>
      b.year * 100 + b.month - (a.year * 100 + a.month),
  );

  const currentPeriod =
    sortedPeriods.find((item) => item.is_active) ??
    sortedPeriods[0] ??
    null;

  /**
   * month / previous_month:
   * Backend ideally should return exactly one period.
   *
   * 3m / 6m / this_year / last_year / custom:
   * Render all periods returned by backend.
   */
  const displayPeriods =
    period === "month" || period === "previous_month"
      ? currentPeriod
        ? [currentPeriod]
        : []
      : sortedPeriods;

  const title =
    period === "month" && currentPeriod
      ? t("fund.fundPeriod", {
        month: currentPeriod.month,
        year: currentPeriod.year,
      })
      : t("fund.title");

  const description =
    period === "month" || period === "previous_month"
      ? t("fund.description")
      : getPeriodDescription(period, t);

  return (
    <DashboardCard
      icon={CircleDollarSign}
      title={title}
      description={description}
      action={
        <Link
          href={clubRoute(
            slug,
            CLUB_SUBROUTES.monthlyContributions,
          )}
          className="
            inline-flex
            shrink-0
            items-center
            gap-1
            rounded-lg
            px-2
            py-1
            text-sm
            font-semibold
            text-primary
            transition-colors
            hover:bg-primary/10
          "
        >
          {t("common.details")}

          <ArrowRight className="size-4" />
        </Link>
      }
    >

      {!displayPeriods.length ? (
        <DashboardState
          message={t("fund.noFundPeriod")}
        />
      ) : (
        <div className="divide-y divide-border">
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

/* -------------------------------------------------------------------------- */
/* Fund period item                                                           */
/* -------------------------------------------------------------------------- */

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
    <article
      className="
        flex
        flex-col
        gap-4
        px-4
        py-5

        sm:px-5

        lg:flex-row
        lg:items-center
        lg:gap-5
      "
    >
      {/* Period date */}
      <FundPeriodDate
        period={period}
        t={t}
      />

      {/* Main information */}
      <div className="min-w-0 flex-1">
        {/* Title + status */}
        <div
          className="
            flex
            min-w-0
            flex-col
            gap-2

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:gap-4
          "
        >
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

          <FundPeriodStatus
            period={period}
            t={t}
          />
        </div>

        {/* Contribution statistics */}
        <FundPeriodMeta
          period={period}
          locale={locale}
          t={t}
        />
      </div>

      {/* Paid amount */}
      <FundPeriodPaid
        period={period}
        locale={locale}
        t={t}
      />
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Period date                                                                */
/* -------------------------------------------------------------------------- */

function FundPeriodDate({
  period,
  t,
}: {
  period: DashboardFundPeriod;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      className="
        flex
        size-[58px]
        shrink-0
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-primary/15
        bg-primary/10
        text-primary
      "
      aria-label={t("fund.fundPeriod", {
        month: period.month,
        year: period.year,
      })}
    >
      <span className="text-[9px] font-bold uppercase tracking-wide">
        {String(period.month).padStart(2, "0")}
      </span>

      <strong className="mt-0.5 text-xl font-bold leading-none">
        {String(period.year).slice(-2)}
      </strong>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Period meta                                                                */
/* -------------------------------------------------------------------------- */

function FundPeriodMeta({
  period,
  t,
}: {
  period: DashboardFundPeriod;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      className="
        mt-3
        flex
        min-w-0
        flex-wrap
        items-center
        gap-x-4
        gap-y-2
        text-xs
        text-foreground-muted
      "
    >
      <FundCountMeta
        label={t("fund.paid")}
        count={period.paid_count}
      />

      <span className="hidden h-3 w-px bg-border sm:block" />

      <FundCountMeta
        label={t("fund.pending")}
        count={period.pending_count}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Count meta                                                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Paid amount                                                                */
/* -------------------------------------------------------------------------- */

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
    <div
      className="
        flex
        shrink-0
        items-center
        justify-between
        gap-4
        border-t
        border-border
        pt-3

        sm:min-w-[220px]
        sm:border-t-0
        sm:border-l
        sm:pl-5
        sm:pt-0

        sm:text-right
      "
    >
      <div className="min-w-0 sm:w-full">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("fund.paid")}
        </p>

        <p className="mt-1 text-base font-bold tabular-nums text-foreground">
          {formatAmount(
            Number(period.total_paid),
            "₫",
            locale,
          )}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

function FundPeriodStatus({
  period,
  t,
}: {
  period: DashboardFundPeriod;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {period.is_active ? (
        <Badge
          variant="active"
          title={t("fund.active")}
        />
      ) : null}

      {period.is_locked ? (
        <Badge
          variant="locked"
          title={t("fund.locked")}
        />
      ) : null}

      {!period.is_active && !period.is_locked ? (
        <Badge
          variant="inactive"
          title={t("fund.inactive")}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Description                                                                */
/* -------------------------------------------------------------------------- */

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