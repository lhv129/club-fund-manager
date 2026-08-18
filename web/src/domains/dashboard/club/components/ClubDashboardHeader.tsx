"use client";

import DatePicker from "@/components/shared/ui/DatePicker";
import { CalendarDays, RefreshCw } from "lucide-react";
import type { DashboardFilters, DashboardPeriod } from "../types";
import { DashboardPeriodFilter } from "./DashboardPeriodFilter";

type HeaderFilters = Pick<DashboardFilters, "period" | "date_from" | "date_to">;

export function ClubDashboardHeader({ value, isFetching, onChange, onRefresh }: {
  value: HeaderFilters;
  isFetching: boolean;
  onChange: (value: HeaderFilters) => void;
  onRefresh: () => void;
}) {
  const invalidCustomRange = value.period === "custom" && (
    !value.date_from || !value.date_to || value.date_from > value.date_to
  );

  const handlePeriodChange = (period: DashboardPeriod) => {
    onChange({
      period,
      ...(period === "custom" ? { date_from: value.date_from, date_to: value.date_to } : {}),
    });
  };

  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Club workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Tổng quan câu lạc bộ</h1>
        <p className="mt-1 text-sm text-foreground-muted">Dữ liệu trực tiếp từ các module tài chính, quỹ, thành viên và buổi đánh.</p>
      </div>
      <div className="grid w-full grid-cols-1 items-end gap-2 sm:grid-cols-[13rem_auto] xl:w-auto xl:grid-cols-[13rem_auto]">
        <div>
          <p className="mb-1 text-xs font-medium text-foreground-muted">Khoảng thời gian</p>
          <DashboardPeriodFilter period={value.period} onPeriodChange={handlePeriodChange} />
        </div>
        {value.period === "custom" && (
          <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[11rem_11rem_auto]">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium text-foreground-muted">Từ ngày</p>
              <DatePicker value={value.date_from} onChange={(date_from) => onChange({ ...value, date_from })} rightIcon={<CalendarDays className="size-4" />} className="h-10 py-2" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium text-foreground-muted">Đến ngày</p>
              <DatePicker value={value.date_to} onChange={(date_to) => onChange({ ...value, date_to })} rightIcon={<CalendarDays className="size-4" />} className="h-10 py-2" />
            </div>
            <button type="button" onClick={onRefresh} disabled={isFetching || invalidCustomRange} title="Làm mới dữ liệu" aria-label="Làm mới dữ liệu" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-background-muted disabled:opacity-50">
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
        {value.period !== "custom" && (
          <button type="button" onClick={onRefresh} disabled={isFetching} title="Làm mới dữ liệu" aria-label="Làm mới dữ liệu" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-background-muted disabled:opacity-50">
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        )}
        {invalidCustomRange && <p className="text-xs text-red-500 sm:col-span-2">Vui lòng chọn khoảng ngày hợp lệ.</p>}
      </div>
    </header>
  );
}
