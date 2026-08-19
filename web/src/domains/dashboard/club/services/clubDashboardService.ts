"use client";

import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardActivityPoint,
  DashboardCashFlowPoint,
  DashboardContribution,
  DashboardContributionSummary,
  DashboardFundBalance,
  DashboardFilters,
  DashboardFundPeriod,
  DashboardMemberStats,
  DashboardSession,
  DashboardTransaction,
  DashboardTransactionSummary,
} from "../types";

export type DashboardCollectionResponse<T> = ApiResponse<T[]>;
export type DashboardSummaryResponse<T, S> = ApiResponse<{ summary: S; items: T[] }>;

const path = (resource: string) => `/dashboard/${resource}`;

export const clubDashboardService = {
  memberStats: (params: DashboardFilters) =>
    browserAdapter.get<ApiResponse<DashboardMemberStats>>(path("memberStats"), params),
  fundPeriods: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardFundPeriod>>(path("fundPeriods"), params),
  contributions: (params: DashboardFilters) =>
    browserAdapter.get<DashboardSummaryResponse<DashboardContribution, DashboardContributionSummary>>(path("contributions"), params),
  sessions: (params: DashboardFilters) =>
    browserAdapter.get<ApiResponse<DashboardSession[]> | ApiResponse<{ items: DashboardSession[] }>>(path("sessions"), params),
  transactions: (params: DashboardFilters) =>
    browserAdapter.get<DashboardSummaryResponse<DashboardTransaction, DashboardTransactionSummary>>(path("transactions"), params),
  fundBalance: (params: Pick<DashboardFilters, "club_slug">) =>
    browserAdapter.get<ApiResponse<DashboardFundBalance>>(path("fundBalance"), params),
  cashFlow: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardCashFlowPoint>>(path("cashFlow"), params),
  activity: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardActivityPoint>>(path("activity"), params),
};
