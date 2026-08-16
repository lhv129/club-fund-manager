"use client";

import { useState } from "react";
import { ClubBreadcrumb } from "@/components/club/layout/ClubBreadcrumb";
import type { DashboardPeriod } from "../types";
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

const dashboardPeriods: DashboardPeriod[] = ["7d", "month", "previous_month"];

function getInitialPeriod(): DashboardPeriod {
  if (typeof window === "undefined") return "7d";

  const period = new URLSearchParams(window.location.search).get("period");
  return dashboardPeriods.includes(period as DashboardPeriod)
    ? (period as DashboardPeriod)
    : "7d";
}

export function ClubDashboard({ locale, slug }: { locale: string; slug: string }) {
  const [period, setPeriodState] = useState<DashboardPeriod>(getInitialPeriod);
  const query = useClubDashboardData(slug);
  const cashFlow = query.data.cashFlowByPeriod[period];
  const activity = query.data.activityByPeriod[period];

  const setPeriod = (next: DashboardPeriod) => {
    setPeriodState(next);
    const params = new URLSearchParams(window.location.search);
    params.set("period", next);
    params.delete("from");
    params.delete("to");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  return <div className="mx-auto max-w-[1600px] space-y-5"><ClubBreadcrumb slug={slug} /><ClubDashboardHeader period={period} isFetching={query.isFetching} onPeriodChange={setPeriod} onRefresh={query.refetch} />{query.isLoading ? <div className="rounded-2xl border border-border bg-background"><DashboardState message="Đang tải dữ liệu dashboard..." /></div> : query.isError ? <div className="rounded-2xl border border-red-500/30 bg-background"><DashboardState message="Không thể tải dữ liệu dashboard. Hãy thử làm mới." /></div> : <><ClubFinancialSummary cashFlow={cashFlow} contributions={query.data.contributions} transactionTotal={query.data.transactionTotal} locale={locale} /><section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]"><CashFlowInteractive data={cashFlow} locale={locale} /><ClubMemberHealth data={query.data.memberStats} slug={slug} /></section><section className="grid gap-5 xl:grid-cols-3"><ContributionStatusChart data={query.data.contributions} /><TransactionSourceChart data={query.data.transactions} /><SessionScaleChart data={query.data.sessions} locale={locale} /></section><ClubFundOverview periods={query.data.fundPeriods} contributions={query.data.contributions} locale={locale} slug={slug} /><section className="grid gap-5 xl:grid-cols-2"><ActivityInteractive data={activity} /><ClubUpcomingSessions data={query.data.sessions} locale={locale} slug={slug} /></section><ClubRecentTransactions data={query.data.transactions} locale={locale} slug={slug} /></>}</div>;
}
