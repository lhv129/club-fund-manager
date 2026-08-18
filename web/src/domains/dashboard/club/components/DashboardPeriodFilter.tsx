"use client";

import Select from "@/components/shared/ui/Select";
import type { DashboardPeriod } from "../types";

const options: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "month", label: "Tháng này" },
  { value: "previous_month", label: "Tháng trước" },
  { value: "3m", label: "3 tháng gần đây" },
  { value: "6m", label: "6 tháng gần đây" },
  { value: "this_year", label: "Năm nay" },
  { value: "last_year", label: "Năm trước" },
  { value: "custom", label: "Tùy chọn" },
];

export function DashboardPeriodFilter({ period, onPeriodChange }: { period: DashboardPeriod; onPeriodChange: (period: DashboardPeriod) => void }) {
  return (
    <Select
      label="Khoảng thời gian"
      options={options}
      value={period}
      onChange={(value) => {
        if (value) onPeriodChange(value as DashboardPeriod);
      }}
      className="w-full sm:w-52"
    />
  );
}
