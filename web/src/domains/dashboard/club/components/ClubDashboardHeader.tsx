import { RefreshCw } from "lucide-react";
import type { DashboardPeriod } from "../types";
import { DashboardPeriodFilter } from "./DashboardPeriodFilter";

export function ClubDashboardHeader({ period, isFetching, onPeriodChange, onRefresh }: { period: DashboardPeriod; isFetching: boolean; onPeriodChange: (period: DashboardPeriod) => void; onRefresh: () => void }) {
  return <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-medium text-primary">Club workspace</p><h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Tổng quan câu lạc bộ</h1><p className="mt-1 text-sm text-foreground-muted">Dữ liệu trực tiếp từ các module tài chính, quỹ, thành viên và buổi đánh.</p></div><div className="flex flex-wrap items-end gap-2"><DashboardPeriodFilter period={period} onPeriodChange={onPeriodChange} /><button type="button" onClick={onRefresh} disabled={isFetching} title="Làm mới dữ liệu" className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-background-muted disabled:opacity-50"><RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /></button></div></header>;
}
