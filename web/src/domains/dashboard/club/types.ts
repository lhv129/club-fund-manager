import type { ExchangeSession } from "@/domains/exchangeSession/types";
import type { MonthlyContribution } from "@/domains/monthlyContribution/types";
import type { Transaction } from "@/domains/transaction/types";

export type DashboardPeriod =
  | "month"
  | "previous_month"
  | "3m"
  | "6m"
  | "this_year"
  | "last_year"
  | "custom";

export type DashboardFilterValue = {
  period: DashboardPeriod;
  date_from?: string;
  date_to?: string;
};

export type DashboardFilters = DashboardFilterValue & {
  club_slug: string;
} & Record<string, unknown>;

export type DashboardPeriodKey = "day" | "month";

export type DashboardCashFlowPoint = {
  key?: DashboardPeriodKey;
  date: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

export type DashboardActivityPoint = {
  key?: DashboardPeriodKey;
  date: string;
  label: string;
  male: number;
  female: number;
  groups: number;
  total: number;
};

export type DashboardMemberStats = {
  total: number;
  active: number;
  inactive: number;
  new_members: number;
  participating: number;
  outstanding: number;
};

export type DashboardFundPeriod = {
  period_id: number;
  year: number;
  month: number;
  total_paid: number;
  paid_count: number;
  pending_count: number;
  is_active: boolean;
  is_locked: boolean;
};

export type DashboardContribution = Pick<
  MonthlyContribution,
  "id" | "amount" | "status" | "period_id"
> & {
  user: Pick<
    MonthlyContribution["user"],
    "id" | "fullname"
  >;
};

export type DashboardSession = Pick<
  ExchangeSession,
  | "id"
  | "session_date"
  | "court_name"
  | "court_address"
  | "start_time"
  | "end_time"
  | "status"
  | "type"
  | "player_count"
  | "total_amount"
  | "amount_per_player"
>;

export type DashboardTransaction = Pick<
  Transaction,
  | "id"
  | "type"
  | "source"
  | "amount"
  | "description"
  | "reference_code"
  | "transaction_date"
  | "sender_name"
>;

export type DashboardContributionSummary = {
  total: number;
  paid: number;
  pending: number;
  cancelled: number;
  total_amount: number;
};

export type DashboardTransactionSummary = {
  cash_count: number;
  bank_count: number;
  total_count: number;
  cash_amount: number;
  bank_amount: number;
};

export type DashboardFundBalance = {
  income: number;
  expense: number;
  period_balance: number;
  current_balance: number;
};

export type ClubDashboardData = {
  memberStats: DashboardMemberStats;
  fundPeriods: DashboardFundPeriod[];
  contributions: DashboardContribution[];
  contributionSummary: DashboardContributionSummary;
  sessions: DashboardSession[];
  transactions: DashboardTransaction[];
  transactionTotal: number;
  transactionBalance: number;
  transactionSummary: DashboardTransactionSummary;
  fundBalance: DashboardFundBalance;
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

/**
 * Dashboard chart types
 */

export type DashboardPieTooltipItem = {
  name?: string;
  value?: number;
  payload?: {
    amount?: number;
  };
};

export type DashboardSessionChartRow = {
  name: string;
  players: number;
  amount: number;
};

export type DashboardSessionTooltipItem = {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
};

export type DashboardSessionSummary = {
  totalPlayers: number;
  totalAmount: number;
  averagePlayers: number;
  peak?: DashboardSessionChartRow;
};
