import { useTranslations } from "next-intl";
import type { DashboardFundPeriod } from "@/domains/dashboard/club/types";

type FundPeriodDateProps = {
  period?: DashboardFundPeriod;
  sessionDate?: string;
  locale: string;
  size?: "period" | "compact";
};

function parseDate(value: string) {
  const date = new Date(value.slice(0, 10) + "T00:00:00");
  return Number.isNaN(date.getTime()) ? null : date;
}

export function FundPeriodDate({
  period,
  sessionDate,
  locale,
  size = "period",
}: FundPeriodDateProps) {
  const t = useTranslations("clubDashboard");

  if (!period && !sessionDate) {
    return null;
  }

  const date = period
    ? new Date(period.year, period.month - 1, 1)
    : sessionDate
      ? parseDate(sessionDate)
      : null;

  const monthLabel = date
    ? new Intl.DateTimeFormat(locale, { month: "short" })
      .format(date)
      .replace(/\.$/, "")
      .toLocaleUpperCase(locale)
    : "--";
  const mainValue = period
    ? String(period.month).padStart(2, "0")
    : date
      ? String(date.getDate())
      : "--";
  const yearValue = period?.year ?? date?.getFullYear();
  const compact = size === "compact";
  const tileSize = compact
    ? "size-[58px] rounded-xl"
    : "h-[92px] w-[78px] rounded-2xl";
  const accessibleLabel = period
    ? t("fund.fundPeriod", {
      month: period.month,
      year: period.year,
    })
    : date
      ? new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date)
      : sessionDate ?? "--";

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={
        "flex shrink-0 flex-col overflow-hidden border border-primary/15 bg-primary/10 text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md " +
        tileSize
      }
    >
      <div aria-hidden="true" className="h-1.5 shrink-0 bg-primary" />

      <div
        className={
          "flex shrink-0 items-center justify-center bg-primary/10 px-1 " +
          (compact ? "h-4" : "h-7")
        }
      >
        <span
          className={
            "truncate font-bold uppercase tracking-[0.12em] text-primary " +
            (compact ? "text-[8px]" : "text-[10px]")
          }
        >
          {monthLabel}
        </span>
      </div>

      <div
        className={
          "flex flex-1 flex-col items-center justify-center px-1 " +
          (compact ? "bg-background/30" : "border-t border-border/60 bg-background/30")
        }
      >
        <span
          className={
            "font-bold leading-none tracking-tight text-foreground tabular-nums " +
            (compact ? "text-xl" : "text-[30px]")
          }
        >
          {mainValue}
        </span>
        {!compact && yearValue !== undefined ? (
          <span className="mt-1.5 text-[10px] font-medium tracking-wide text-foreground-muted tabular-nums">
            {yearValue}
          </span>
        ) : null}
      </div>

      {!compact ? (
        <div aria-hidden="true" className="h-1 shrink-0 bg-primary/15" />
      ) : null}
    </div>
  );
}
