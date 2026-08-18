"use client";

import { useState } from "react";
import { ClubBreadcrumb } from "@/components/club/layout/ClubBreadcrumb";
import type { DashboardFilters, DashboardPeriod } from "../types";
import { useClubDashboardData } from "../useClubDashboardData";
import { ActivityInteractive } from "./ActivityInteractive";
import { CashFlowInteractive } from "./CashFlowInteractive";
import { ClubDashboardHeader } from "./ClubDashboardHeader";
import { ClubFinancialSummary } from "./ClubFinancialSummary";
import { ClubFundOverview } from "./ClubFundOverview";
import { ClubMemberHealth } from "./ClubMemberHealth";
import { ClubRecentTransactions } from "./ClubRecentTransactions";
import { ClubUpcomingSessions } from "./ClubUpcomingSessions";
import { ContributionStatusChart, SessionScaleChart, TransactionSourceChart } from "./DashboardInsightsCharts";
import { DashboardState } from "./DashboardCard";

const dashboardPeriods: DashboardPeriod[] = ["month", "previous_month", "3m", "6m", "this_year", "last_year", "custom"];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultCustomRange() {
  const now = new Date();
  return {
    date_from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    date_to: toIsoDate(now),
  };
}

function getInitialFilters(): Omit<DashboardFilters, "club_slug"> {
  const defaultRange = getDefaultCustomRange();
  if (typeof window === "undefined") return { period: "month" };

  const params = new URLSearchParams(window.location.search);
  const requestedPeriod = params.get("period") as DashboardPeriod;
  const period = dashboardPeriods.includes(requestedPeriod) ? requestedPeriod : "month";
  if (period !== "custom") return { period };

  return {
    period,
    date_from: params.get("date_from") ?? defaultRange.date_from,
    date_to: params.get("date_to") ?? defaultRange.date_to,
  };
}

export function ClubDashboard({ locale, slug }: { locale: string; slug: string }) {
  const [filterValue, setFilterValue] = useState<Omit<DashboardFilters, "club_slug">>(getInitialFilters);
  const filters: DashboardFilters = { club_slug: slug, ...filterValue };
  const query = useClubDashboardData(filters);

  const setFilters = (next: Omit<DashboardFilters, "club_slug">) => {
    const normalized = next.period === "custom" && (!next.date_from || !next.date_to)
      ? { ...next, ...getDefaultCustomRange() }
      : next;
    setFilterValue(normalized);
    const params = new URLSearchParams(window.location.search);
    params.set("period", normalized.period);
    if (normalized.period === "custom" && normalized.date_from && normalized.date_to) {
      params.set("date_from", normalized.date_from as string);
      params.set("date_to", normalized.date_to as string);
    } else {
      params.delete("date_from");
      params.delete("date_to");
    }
    const queryString = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}`);
  };

  return <div className="mx-auto max-w-[1600px] space-y-5"><ClubBreadcrumb slug={slug} /><ClubDashboardHeader value={filterValue} isFetching={query.isFetching} onChange={setFilters} onRefresh={query.refetch} />{query.isLoading ? <div className="rounded-2xl border border-border bg-background"><DashboardState message="Đang tải dữ liệu dashboard..." /></div> : query.isError ? <div className="rounded-2xl border border-red-500/30 bg-background"><DashboardState message="Không thể tải dữ liệu dashboard. Hãy thử làm mới." /></div> : <><ClubFinancialSummary cashFlow={query.data.cashFlow} contributions={query.data.contributions} transactionTotal={query.data.transactionTotal} locale={locale} /><section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]"><CashFlowInteractive data={query.data.cashFlow} locale={locale} /><ClubMemberHealth data={query.data.memberStats} slug={slug} /></section><section className="grid gap-5 xl:grid-cols-3"><ContributionStatusChart data={query.data.contributions} /><TransactionSourceChart data={query.data.transactions} /><SessionScaleChart data={query.data.sessions} locale={locale} /></section><ClubFundOverview periods={query.data.fundPeriods} contributions={query.data.contributions} locale={locale} slug={slug} /><section className="grid gap-5 xl:grid-cols-2"><ActivityInteractive data={query.data.activity} /><ClubUpcomingSessions data={query.data.sessions} locale={locale} slug={slug} /></section><ClubRecentTransactions data={query.data.transactions} locale={locale} slug={slug} /></>}</div>;
}
