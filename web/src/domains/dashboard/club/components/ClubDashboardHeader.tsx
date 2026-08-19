"use client";

import DatePicker from "@/components/shared/ui/DatePicker";
import { CalendarDays, RefreshCw } from "lucide-react";
import type { DashboardFilterValue, DashboardPeriod } from "../types";
import { DashboardPeriodFilter } from "./DashboardPeriodFilter";
import { useTranslations } from "next-intl";

type HeaderFilters = DashboardFilterValue;

interface ClubDashboardHeaderProps {
  value: HeaderFilters;
  isFetching: boolean;
  onChange: (value: HeaderFilters) => void;
  onRefresh: () => void;
}

export function ClubDashboardHeader({
  value,
  isFetching,
  onChange,
  onRefresh,
}: ClubDashboardHeaderProps) {
  const t = useTranslations("clubDashboard");

  const invalidCustomRange =
    value.period === "custom" &&
    (!value.date_from ||
      !value.date_to ||
      value.date_from > value.date_to);

  const handlePeriodChange = (period: DashboardPeriod) => {
    onChange({
      period,
      ...(period === "custom"
        ? {
          date_from: value.date_from,
          date_to: value.date_to,
        }
        : {}),
    });
  };

  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary">
          {t("header.workspace")}
        </p>

        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          {t("header.overview")}
        </h1>

        <p className="mt-1 text-sm text-foreground-muted">
          {t("header.description")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex w-full flex-col gap-2 xl:w-auto">
        {/* Period + Refresh */}
        <div className="flex w-full items-end gap-2 xl:w-auto">
          {/* Period Select - LEFT */}
          <div className="min-w-0 flex-1 sm:w-52 sm:flex-none">
            <p className="mb-1 text-xs font-medium text-foreground-muted">
              {t("header.period")}
            </p>

            <DashboardPeriodFilter
              period={value.period}
              onPeriodChange={handlePeriodChange}
            />
          </div>

          {/* Refresh / Loading - RIGHT */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching || invalidCustomRange}
            title={t("header.refresh")}
            aria-label={t("header.refresh")}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-background-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Custom Date Range */}
        {value.period === "custom" && (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-foreground-muted">
                {t("header.fromDate")}
              </p>

              <DatePicker
                value={value.date_from}
                onChange={(date_from) =>
                  onChange({
                    ...value,
                    date_from,
                  })
                }
                rightIcon={<CalendarDays className="size-4" />}
                className="h-10 w-full py-2"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-foreground-muted">
                {t("header.toDate")}
              </p>

              <DatePicker
                value={value.date_to}
                onChange={(date_to) =>
                  onChange({
                    ...value,
                    date_to,
                  })
                }
                rightIcon={<CalendarDays className="size-4" />}
                className="h-10 w-full py-2"
              />
            </div>
          </div>
        )}

        {invalidCustomRange && (
          <p className="text-xs text-red-500">
            {t("header.invalidRange")}
          </p>
        )}
      </div>
    </header>
  );
}