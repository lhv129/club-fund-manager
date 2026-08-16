import type { BankAccount } from "@/domains/bankAccount/types";
import type { ExchangeSession } from "@/domains/exchangeSession/types";
import type { FundPeriod } from "@/domains/fundPeriod/types";
import type { ClubMember } from "@/domains/members/types/member";
import type { MonthlyContribution } from "@/domains/monthlyContribution/types";
import type { Transaction } from "@/domains/transaction/types";

export type DashboardPeriod = DashboardChartPeriod;

export type DashboardCashFlowPoint = { date: string; label: string; income: number; expense: number; net: number };
export type DashboardActivityPoint = { date: string; label: string; male: number; female: number; groups: number; total: number };
export type DashboardChartPeriod = "7d" | "month" | "previous_month";
export type DashboardMemberStats = { total: number; active: number; inactive: number; new_members: number; participating: number; outstanding: number };

export type DashboardFundPeriod = Pick<FundPeriod, "id" | "year" | "month" | "male_amount" | "female_amount" | "is_active" | "is_locked">;
export type DashboardContribution = Pick<MonthlyContribution, "id" | "amount" | "status" | "period_id"> & { user: Pick<MonthlyContribution["user"], "id" | "fullname"> };
export type DashboardSession = Pick<ExchangeSession, "id" | "session_date" | "court_name" | "court_address" | "start_time" | "end_time" | "status" | "type" | "player_count" | "total_amount" | "amount_per_player">;
export type DashboardTransaction = Pick<Transaction, "id" | "type" | "source" | "amount" | "description" | "reference_code" | "transaction_date" | "sender_name">;

export type ClubDashboardData = {
  members: ClubMember[];
  memberTotal: number;
  memberStats: DashboardMemberStats;
  fundPeriods: DashboardFundPeriod[];
  contributions: DashboardContribution[];
  sessions: DashboardSession[];
  transactions: DashboardTransaction[];
  transactionTotal: number;
  bankAccounts: BankAccount[];
  cashFlow: DashboardCashFlowPoint[];
  activity: DashboardActivityPoint[];
  cashFlowByPeriod: Record<DashboardChartPeriod, DashboardCashFlowPoint[]>;
  activityByPeriod: Record<DashboardChartPeriod, DashboardActivityPoint[]>;
};

export type DashboardQueryState = {
  data: ClubDashboardData;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
};
