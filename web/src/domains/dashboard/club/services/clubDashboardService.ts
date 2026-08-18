"use client";

import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse, PaginationMeta } from "@/types/api";
import type {
  DashboardActivityPoint,
  DashboardCashFlowPoint,
  DashboardContribution,
  DashboardFilters,
  DashboardFundPeriod,
  DashboardMemberStats,
  DashboardSession,
  DashboardTransaction,
} from "../types";

export type DashboardCollectionResponse<T> = ApiResponse<T[]> & {
  meta?: PaginationMeta;
};

const path = (resource: string) => `/dashboard/${resource}`;

export const clubDashboardService = {
  memberStats: (params: DashboardFilters) =>
    browserAdapter.get<ApiResponse<DashboardMemberStats>>(path("memberStats"), params),
  fundPeriods: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardFundPeriod>>(path("fundPeriods"), params),
  contributions: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardContribution>>(path("contributions"), params),
  sessions: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardSession>>(path("sessions"), params),
  transactions: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardTransaction>>(path("transactions"), params),
  cashFlow: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardCashFlowPoint>>(path("cashFlow"), params),
  activity: (params: DashboardFilters) =>
    browserAdapter.get<DashboardCollectionResponse<DashboardActivityPoint>>(path("activity"), params),
};
