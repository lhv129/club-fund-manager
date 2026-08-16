"use client";

import { useState } from "react";
import { clubDashboardMockData } from "./mockData";
import type { DashboardQueryState } from "./types";

/**
 * Dashboard data source. Replace the mock return with one aggregate query when
 * the backend dashboard endpoint is available; components do not need to change.
 */
export function useClubDashboardData(slug: string): DashboardQueryState {
  void slug;
  const [isFetching, setIsFetching] = useState(false);
  const refetch = () => { setIsFetching(true); window.setTimeout(() => setIsFetching(false), 350); };
  return { data: clubDashboardMockData, isLoading: false, isFetching, isError: false, refetch };
}
