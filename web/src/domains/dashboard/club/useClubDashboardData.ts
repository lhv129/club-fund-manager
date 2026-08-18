"use client";

import {
  useDashboardActivity,
  useDashboardCashFlow,
  useDashboardContributions,
  useDashboardFundPeriods,
  useDashboardMemberStats,
  useDashboardSessions,
  useDashboardTransactions,
} from "./hooks/useClubDashboardQueries";
import type { DashboardFilters, DashboardMemberStats, DashboardQueryState } from "./types";

/** Aggregate the seven dashboard resources behind one component-facing state. */
const emptyMemberStats: DashboardMemberStats = {
  total: 0,
  active: 0,
  inactive: 0,
  new_members: 0,
  participating: 0,
  outstanding: 0,
};

export function useClubDashboardData(filters: DashboardFilters): DashboardQueryState {
  const memberStats = useDashboardMemberStats(filters);
  const fundPeriods = useDashboardFundPeriods(filters);
  const contributions = useDashboardContributions(filters);
  const sessions = useDashboardSessions(filters);
  const transactions = useDashboardTransactions(filters);
  const cashFlow = useDashboardCashFlow(filters);
  const activity = useDashboardActivity(filters);
  const queries = [memberStats, fundPeriods, contributions, sessions, transactions, cashFlow, activity];

  return {
    data: {
      memberStats: memberStats.data?.data ?? emptyMemberStats,
      fundPeriods: fundPeriods.data?.data ?? [],
      contributions: contributions.data?.data ?? [],
      sessions: sessions.data?.data ?? [],
      transactions: transactions.data?.data ?? [],
      transactionTotal: transactions.data?.meta?.total ?? transactions.data?.data?.length ?? 0,
      cashFlow: cashFlow.data?.data ?? [],
      activity: activity.data?.data ?? [],
    },
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError || query.data?.success === false),
    refetch: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
}
