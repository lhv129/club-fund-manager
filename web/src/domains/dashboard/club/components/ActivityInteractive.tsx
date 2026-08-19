"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Info, RotateCcw, TrendingUp } from "lucide-react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardActivityPoint } from "../types";
import { DashboardCard, DashboardState } from "./DashboardCard";
import { useDashboardChartColors } from "./useDashboardChartColors";

import "./_group.css";

type SeriesKey = "total" | "male" | "female" | "groups";

export function ActivityInteractive({
  data,
}: {
  data: DashboardActivityPoint[];
}) {
  const t = useTranslations("clubDashboard");
  const colors = useDashboardChartColors();

  const gradientId = useId().replace(/:/g, "");

  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    total: true,
    male: true,
    female: true,
    groups: true,
  });

  const summary = useMemo(
    () => ({
      average: data.length
        ? data.reduce((sum, item) => sum + item.total, 0) / data.length
        : 0,

      peak: data.reduce(
        (peak, item) => (item.total > peak.total ? item : peak),
        data[0],
      ),
    }),
    [data],
  );

  const series = [
    {
      key: "total" as const,
      label: t("activity.total"),
      color: colors.total,
    },
    {
      key: "male" as const,
      label: t("activity.male"),
      color: colors.male,
    },
    {
      key: "female" as const,
      label: t("activity.female"),
      color: colors.female,
    },
    {
      key: "groups" as const,
      label: t("activity.groups"),
      color: colors.groups,
    },
  ];

  const reset = () => {
    setVisible({
      total: true,
      male: true,
      female: true,
      groups: true,
    });
  };

  const isDenseData = data.length > 14;
  const shouldShowBrush = data.length > 14;

  const xAxisInterval =
    data.length <= 12 ? 0 : "preserveStartEnd";

  const chartHeightClass = isDenseData
    ? "h-[330px] sm:h-[390px] lg:h-[430px]"
    : "h-[300px] sm:h-[360px] lg:h-[400px]";

  const animationDuration = isDenseData ? 650 : 900;

  const getTooltipTitle = (label: unknown) => {
    const point = data.find(
      (item) => String(item.label) === String(label),
    );

    if (!point) {
      return String(label);
    }

    return `${t(`common.${point.key ?? "day"}`)} ${point.label}`;
  };

  return (
    <DashboardCard
      icon={TrendingUp}
      title={t("activity.title")}
      description={t("activity.description")}
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Info className="size-3.5 shrink-0" />

          <span>{t("cashFlow.chartInfo")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          {series.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={visible[item.key]}
              onClick={() =>
                setVisible((current) => ({
                  ...current,
                  [item.key]: !current[item.key],
                }))
              }
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-opacity ${visible[item.key]
                  ? "border-border text-foreground"
                  : "border-transparent text-foreground-muted opacity-40 line-through"
                }`}
            >
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={reset}
            title={t("cashFlow.resetSeries")}
            aria-label={t("cashFlow.resetSeries")}
            className="flex size-7 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="grid divide-y divide-border border-b border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-4 py-4 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
            {t("cashFlow.average")}
          </p>

          <p className="mt-1 text-base font-bold text-foreground">
            {summary.average.toFixed(1).replace(".", ",")}

            <span className="ml-1 text-xs font-medium text-foreground-muted">
              {t("common.people")}/{t("common.day")}
            </span>
          </p>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
            {t("cashFlow.highest")}
          </p>

          <p
            className="mt-1 text-base font-bold"
            style={{
              color: colors.total,
            }}
          >
            {summary.peak?.label ?? "—"}

            <span className="ml-1 text-xs font-medium text-foreground-muted">
              · {summary.peak?.total ?? 0} {t("common.people")}
            </span>
          </p>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
            {t("cashFlow.coverage")}
          </p>

          <p
            className="mt-1 text-base font-bold"
            style={{
              color: colors.total,
            }}
          >
            {data.length}

            <span className="ml-1 text-xs font-medium text-foreground-muted">
              {t("common.days")}
            </span>
          </p>
        </div>
      </div>

      {!data.length ? (
        <DashboardState message={t("common.noDataRange")} />
      ) : (
        <div className="w-full px-2 pb-2 pt-4 sm:px-6 sm:pt-5">
          <div className="mb-2 flex items-center justify-between gap-3 px-1 text-[11px] text-foreground-muted">
            <span>
              {isDenseData
                ? t("cashFlow.dragHint")
                : t("cashFlow.hoverHint")}
            </span>

            <span className="shrink-0">
              {t("cashFlow.dataPoints", {
                count: data.length,
              })}
            </span>
          </div>

          <div className={chartHeightClass}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                accessibilityLayer
                data={data}
                margin={{
                  top: 12,
                  right: 10,
                  left: -16,
                  bottom: shouldShowBrush ? 8 : 4,
                }}
              >
                <defs>
                  <linearGradient
                    id={`${gradientId}-total-area`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={colors.total}
                      stopOpacity={0.2}
                    />

                    <stop
                      offset="55%"
                      stopColor={colors.total}
                      stopOpacity={0.07}
                    />

                    <stop
                      offset="100%"
                      stopColor={colors.total}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke={colors.grid}
                  strokeDasharray="2 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  interval={xAxisInterval}
                  minTickGap={isDenseData ? 34 : 22}
                  tick={{
                    fill: colors.foregroundMuted,
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  width={38}
                  tick={{
                    fill: colors.foregroundMuted,
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  cursor={{
                    stroke: colors.borderStrong,
                    strokeDasharray: "4 4",
                  }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }

                    return (
                      <div className="min-w-48 rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur">
                        <p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-foreground">
                          {getTooltipTitle(label)}
                        </p>

                        <div className="space-y-1">
                          {payload.map((item) => {
                            const isGroups =
                              item.dataKey === "groups";

                            return (
                              <div
                                key={String(
                                  item.dataKey ?? item.name,
                                )}
                                className="flex items-center justify-between gap-5 py-1 text-xs"
                              >
                                <span className="flex min-w-0 items-center gap-2 text-foreground-muted">
                                  <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: item.color,
                                    }}
                                  />

                                  <span className="truncate">
                                    {item.name}
                                  </span>
                                </span>

                                <strong className="shrink-0 text-foreground">
                                  {item.value}{" "}
                                  {isGroups
                                    ? t("common.groups")
                                    : t("common.people")}
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="total"
                  name={t("activity.total")}
                  fill={`url(#${gradientId}-total-area)`}
                  stroke={colors.total}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: colors.total,
                    stroke: colors.background,
                    strokeWidth: 3,
                  }}
                  hide={!visible.total}
                  isAnimationActive
                  animationDuration={animationDuration}
                  animationEasing="ease-out"
                />

                <Line
                  type="monotone"
                  dataKey="male"
                  name={t("activity.male")}
                  stroke={colors.male}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: colors.male,
                    stroke: colors.background,
                    strokeWidth: 3,
                  }}
                  hide={!visible.male}
                  isAnimationActive
                  animationBegin={120}
                  animationDuration={animationDuration + 80}
                  animationEasing="ease-out"
                />

                <Line
                  type="monotone"
                  dataKey="female"
                  name={t("activity.female")}
                  stroke={colors.female}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: colors.female,
                    stroke: colors.background,
                    strokeWidth: 3,
                  }}
                  hide={!visible.female}
                  isAnimationActive
                  animationBegin={240}
                  animationDuration={animationDuration + 120}
                  animationEasing="ease-out"
                />

                <Line
                  type="monotone"
                  dataKey="groups"
                  name={t("activity.groups")}
                  stroke={colors.groups}
                  strokeWidth={2.2}
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: colors.groups,
                    stroke: colors.background,
                    strokeWidth: 3,
                  }}
                  hide={!visible.groups}
                  isAnimationActive
                  animationBegin={360}
                  animationDuration={animationDuration + 160}
                  animationEasing="ease-out"
                />

                {shouldShowBrush ? (
                  <Brush
                    dataKey="label"
                    height={24}
                    stroke={colors.total}
                    fill={colors.backgroundSubtle}
                    travellerWidth={9}
                    tickFormatter={() => ""}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}