"use client";

import {
  useDashboardActivity,
  useDashboardCashFlow,
  useDashboardContributions,
  useDashboardFundPeriods,
  useDashboardFundBalance,
  useDashboardMemberStats,
  useDashboardSessions,
  useDashboardTransactions,
} from "./hooks/useClubDashboardQueries";
import type { DashboardContributionSummary, DashboardFilters, DashboardFundBalance, DashboardMemberStats, DashboardQueryState, DashboardSession, DashboardTransactionSummary } from "./types";

/** Aggregate the seven dashboard resources behind one component-facing state. */
const emptyMemberStats: DashboardMemberStats = {
  total: 0,
  active: 0,
  inactive: 0,
  new_members: 0,
  participating: 0,
  outstanding: 0,
};
const emptyContributionSummary: DashboardContributionSummary = { total: 0, paid: 0, pending: 0, cancelled: 0, total_amount: 0 };
const emptyTransactionSummary: DashboardTransactionSummary = { cash_count: 0, bank_count: 0, total_count: 0, cash_amount: 0, bank_amount: 0 };
const emptyFundBalance: DashboardFundBalance = { income: 0, expense: 0, period_balance: 0, current_balance: 0 };

export function useClubDashboardData(filters: DashboardFilters): DashboardQueryState {
  const memberStats = useDashboardMemberStats(filters);
  const fundPeriods = useDashboardFundPeriods(filters);
  const contributions = useDashboardContributions(filters);
  const sessions = useDashboardSessions(filters);
  const transactions = useDashboardTransactions(filters);
  const fundBalance = useDashboardFundBalance(filters);
  const cashFlow = useDashboardCashFlow(filters);
  const activity = useDashboardActivity(filters);
  const queries = [memberStats, fundPeriods, contributions, sessions, transactions, fundBalance, cashFlow, activity];

  return {
    data: {
      memberStats: memberStats.data?.data ?? emptyMemberStats,
      fundPeriods: fundPeriods.data?.data ?? [],
      contributions: contributions.data?.data?.items ?? [],
      contributionSummary: contributions.data?.data?.summary ?? emptyContributionSummary,
      sessions: Array.isArray(sessions.data?.data)
        ? sessions.data.data
        : (sessions.data?.data as { items?: DashboardSession[] } | undefined)?.items ?? [],
      transactions: transactions.data?.data?.items ?? [],
      transactionTotal: transactions.data?.data?.summary.total_count ?? 0,
      transactionBalance:
        (transactions.data?.data?.summary?.bank_amount ?? 0) +
        (transactions.data?.data?.summary?.cash_amount ?? 0),
      transactionSummary: transactions.data?.data?.summary ?? emptyTransactionSummary,
      fundBalance: fundBalance.data?.data ?? emptyFundBalance,
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
