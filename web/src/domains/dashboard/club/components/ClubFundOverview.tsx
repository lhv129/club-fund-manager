import { ArrowRight, CircleDollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { CLUB_SUBROUTES, clubRoute } from "@/constants";
import type {
  DashboardContribution,
  DashboardFundPeriod,
} from "../types";
import { Link } from "@/i18n/routing";
import { formatAmount } from "@/utils";
import { DashboardCard, DashboardState } from "./DashboardCard";

export function ClubFundOverview({
  periods,
  contributions,
  locale,
  slug,
}: {
  periods: DashboardFundPeriod[];
  contributions: DashboardContribution[];
  locale: string;
  slug: string;
}) {
  const t = useTranslations("clubDashboard");

  const period =
    periods.find((item) => item.is_active) ?? periods[0];

  const pending = contributions.filter(
    (item) =>
      item.status === "pending" &&
      (!period || item.period_id === period.id),
  );

  return (
    <DashboardCard
      icon={CircleDollarSign}
      title={
        period
          ? t("fund.fundPeriod", {
            month: period.month,
            year: period.year,
          })
          : t("fund.currentPeriod")
      }
      description={t("fund.description")}
      action={
        <Link
          href={clubRoute(
            slug,
            CLUB_SUBROUTES.monthlyContributions,
          )}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {t("common.details")}
          <ArrowRight className="size-4" />
        </Link>
      }
    >
      {!period ? (
        <DashboardState message={t("fund.noFundPeriod")} />
      ) : (
        <div className="grid gap-5 p-5 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-xl bg-background-subtle p-4">
            <p className="text-xs text-foreground-muted">
              {t("fund.status")}
            </p>

            <p className="mt-1 font-semibold text-foreground">
              {period.is_locked
                ? t("fund.locked")
                : period.is_active
                  ? t("fund.active")
                  : t("fund.inactive")}
            </p>

            <p className="mt-4 text-xs text-foreground-muted">
              {t("fund.maleFee")}
            </p>

            <p className="mt-1 font-semibold text-foreground">
              {formatAmount(
                period.male_amount,
                "₫",
                locale,
              )}
            </p>

            <p className="mt-3 text-xs text-foreground-muted">
              {t("fund.femaleFee")}
            </p>

            <p className="mt-1 font-semibold text-foreground">
              {formatAmount(
                period.female_amount,
                "₫",
                locale,
              )}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("fund.pendingInLoadedData")}
            </h3>

            {!pending.length ? (
              <p className="mt-4 text-sm text-foreground-muted">
                {t("fund.noPendingInCurrentPage")}
              </p>
            ) : (
              <div className="mt-2 divide-y divide-border">
                {pending.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.user.fullname}
                      </p>

                      <p className="text-xs text-foreground-muted">
                        {t("fund.pending")}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-amber-500">
                      {formatAmount(
                        item.amount,
                        "₫",
                        locale,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}