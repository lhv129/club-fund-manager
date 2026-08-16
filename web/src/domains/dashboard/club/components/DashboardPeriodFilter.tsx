"use client";

import type { DashboardPeriod } from "../types";

const options: Array<[DashboardPeriod, string]> = [["7d", "7 ngày"], ["month", "Tháng này"], ["previous_month", "Tháng trước"]];

export function DashboardPeriodFilter({ period, onPeriodChange }: { period: DashboardPeriod; onPeriodChange: (period: DashboardPeriod) => void }) {
  return <div className="flex flex-wrap items-end gap-2"><select value={period} onChange={(event) => onPeriodChange(event.target.value as DashboardPeriod)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>;
}
