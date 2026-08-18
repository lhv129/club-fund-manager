import type { ExchangeSession } from "@/domains/exchangeSession/types";
import type { FundPeriod } from "@/domains/fundPeriod/types";
import type { MonthlyContribution } from "@/domains/monthlyContribution/types";
import type { Transaction } from "@/domains/transaction/types";

export type DashboardPeriod = "month" | "previous_month" | "3m" | "6m" | "this_year" | "last_year" | "custom";

export type DashboardFilters = {
  club_slug: string;
  period: DashboardPeriod;
  date_from?: string;
  date_to?: string;
} & Record<string, unknown>;

export type DashboardCashFlowPoint = { date: string; label: string; income: number; expense: number; net: number };
export type DashboardActivityPoint = { date: string; label: string; male: number; female: number; groups: number; total: number };
export type DashboardMemberStats = { total: number; active: number; inactive: number; new_members: number; participating: number; outstanding: number };

export type DashboardFundPeriod = Pick<FundPeriod, "id" | "year" | "month" | "male_amount" | "female_amount" | "is_active" | "is_locked">;
export type DashboardContribution = Pick<MonthlyContribution, "id" | "amount" | "status" | "period_id"> & { user: Pick<MonthlyContribution["user"], "id" | "fullname"> };
export type DashboardSession = Pick<ExchangeSession, "id" | "session_date" | "court_name" | "court_address" | "start_time" | "end_time" | "status" | "type" | "player_count" | "total_amount" | "amount_per_player">;
export type DashboardTransaction = Pick<Transaction, "id" | "type" | "source" | "amount" | "description" | "reference_code" | "transaction_date" | "sender_name">;

export type ClubDashboardData = {
  memberStats: DashboardMemberStats;
  fundPeriods: DashboardFundPeriod[];
  contributions: DashboardContribution[];
  sessions: DashboardSession[];
  transactions: DashboardTransaction[];
  transactionTotal: number;
  cashFlow: DashboardCashFlowPoint[];
  activity: DashboardActivityPoint[];
};

export type DashboardQueryState = {
  data: ClubDashboardData;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
};
