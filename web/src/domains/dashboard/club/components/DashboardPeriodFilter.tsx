"use client";

import Select from "@/components/shared/ui/Select";
import type { DashboardPeriod } from "../types";
import { useTranslations } from "next-intl";

export function DashboardPeriodFilter({
  period,
  onPeriodChange,
}: {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}) {
  const t = useTranslations("clubDashboard");

  const options = (
    [
      "month",
      "previous_month",
      "3m",
      "6m",
      "this_year",
      "last_year",
      "custom",
    ] as DashboardPeriod[]
  ).map((value) => ({
    value,
    label: t(`header.periods.${value}`),
  }));

  return (
    <Select
      label={t("header.period")}
      options={options}
      value={period}
      onChange={(value) => {
        if (value) onPeriodChange(value as DashboardPeriod);
      }}
      className="w-full sm:w-52"
    />
  );
}