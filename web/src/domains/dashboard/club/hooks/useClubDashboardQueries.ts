"use client";

import { useQuery } from "@tanstack/react-query";
import { clubDashboardService } from "../services/clubDashboardService";
import type { DashboardFilters } from "../types";

function canFetch(filters: DashboardFilters): boolean {
  return Boolean(filters.club_slug) && (
    filters.period !== "custom" || Boolean(
      filters.date_from && filters.date_to && filters.date_from <= filters.date_to,
    )
  );
}

export function useDashboardMemberStats(filters: DashboardFilters) {
  return useQuery({ queryKey: ["club-dashboard", "memberStats", filters], queryFn: () => clubDashboardService.memberStats(filters), enabled: canFetch(filters) });
}

export function useDashboardFundPeriods(filters: DashboardFilters) {
  return useQuery({ queryKey: ["club-dashboard", "fundPeriods", filters], queryFn: () => clubDashboardService.fundPeriods(filters), enabled: canFetch(filters) });
}

export function useDashboardContributions(filters: DashboardFilters) {
  return useQuery({ queryKey: ["club-dashboard", "contributions", filters], queryFn: () => clubDashboardService.contributions(filters), enabled: canFetch(filters) });
}

export function useDashboardSessions(filters: DashboardFilters) {
  return useQuery({ queryKey: ["club-dashboard", "sessions", filters], queryFn: () => clubDashboardService.sessions(filters), enabled: canFetch(filters) });
}

export function useDashboardTransactions(filters: DashboardFilters) {
  return useQuery({ queryKey: ["club-dashboard", "transactions", filters], queryFn: () => clubDashboardService.transactions(filters), enabled: canFetch(filters) });
}

export function useDashboardFundBalance(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["club-dashboard", "fundBalance", filters.club_slug],
    queryFn: () => clubDashboardService.fundBalance(filters),
    enabled: Boolean(filters.club_slug),
  });
}

export function useDashboardCashFlow(filters: DashboardFilters) {
  return useQuery({ queryKey: ["club-dashboard", "cashFlow", filters], queryFn: () => clubDashboardService.cashFlow(filters), enabled: canFetch(filters) });
}

export function useDashboardActivity(filters: DashboardFilters) {
  return useQuery({ queryKey: ["club-dashboard", "activity", filters], queryFn: () => clubDashboardService.activity(filters), enabled: canFetch(filters) });
}
