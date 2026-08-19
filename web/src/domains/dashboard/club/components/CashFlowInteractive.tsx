"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, Info, RotateCcw } from "lucide-react";
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

import type { DashboardCashFlowPoint } from "../types";
import { formatAmount } from "@/utils";
import { DashboardCard, DashboardState } from "./DashboardCard";
import { useDashboardChartColors } from "./useDashboardChartColors";

import "./_group.css";

type SeriesKey = "income" | "expense" | "net";

function compact(value: number) {
  const absoluteValue = Math.abs(value);
  const prefix = value < 0 ? "-" : "";

  if (absoluteValue >= 1_000_000) {
    return `${prefix}${(absoluteValue / 1_000_000).toFixed(
      absoluteValue % 1_000_000 ? 1 : 0,
    )}tr`;
  }

  if (absoluteValue >= 1_000) {
    return `${prefix}${Math.round(absoluteValue / 1_000)}k`;
  }

  return `${value}`;
}

export function CashFlowInteractive({
  data,
  locale,
}: {
  data: DashboardCashFlowPoint[];
  locale: string;
}) {
  const t = useTranslations("clubDashboard");
  const colors = useDashboardChartColors();

  const gradientPrefix = useId().replace(/:/g, "");

  const [visible, setVisible] = useState<
    Record<SeriesKey, boolean>
  >({
    income: true,
    expense: true,
    net: true,
  });

  const totals = useMemo(
    () =>
      data.reduce(
        (sum, point) => ({
          income: sum.income + point.income,
          expense: sum.expense + point.expense,
          net: sum.net + point.net,
        }),
        {
          income: 0,
          expense: 0,
          net: 0,
        },
      ),
    [data],
  );

  const series = [
    {
      key: "income" as const,
      label: t("cashFlow.incomeShort"),
      color: colors.income,
    },
    {
      key: "expense" as const,
      label: t("cashFlow.expenseShort"),
      color: colors.expense,
    },
    {
      key: "net" as const,
      label: t("cashFlow.netShort"),
      color: colors.net,
    },
  ];

  const reset = () => {
    setVisible({
      income: true,
      expense: true,
      net: true,
    });
  };

  const isDenseData = data.length > 14;
  const shouldShowBrush = data.length > 14;

  const xAxisInterval =
    data.length <= 12
      ? 0
      : "preserveStartEnd";

  const chartHeightClass = isDenseData
    ? "h-[330px] sm:h-[380px] lg:h-[430px]"
    : "h-[300px] sm:h-[350px] lg:h-[390px]";

  const animationDuration = isDenseData ? 650 : 900;

  return (
    <DashboardCard
      icon={BarChart3}
      title={t("cashFlow.title")}
      description={t("cashFlow.description")}
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Info className="size-3.5 shrink-0" />

          <span>
            {t("cashFlow.chartInfo")}
          </span>
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
        {series.map((item) => (
          <div
            key={item.key}
            className="min-w-0 px-4 py-4 sm:px-6"
          >
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              {item.label}
            </p>

            <p
              className="mt-1 truncate text-base font-bold"
              style={{
                color: item.color,
              }}
            >
              {formatAmount(
                totals[item.key],
                "₫",
                locale,
              )}
            </p>
          </div>
        ))}
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
                  left: -10,
                  bottom: shouldShowBrush ? 8 : 4,
                }}
              >
                <defs>
                  <linearGradient
                    id={`${gradientPrefix}-income`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={colors.income}
                      stopOpacity={0.18}
                    />

                    <stop
                      offset="55%"
                      stopColor={colors.income}
                      stopOpacity={0.07}
                    />

                    <stop
                      offset="100%"
                      stopColor={colors.income}
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id={`${gradientPrefix}-expense`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={colors.expense}
                      stopOpacity={0.14}
                    />

                    <stop
                      offset="55%"
                      stopColor={colors.expense}
                      stopOpacity={0.05}
                    />

                    <stop
                      offset="100%"
                      stopColor={colors.expense}
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id={`${gradientPrefix}-net`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={colors.net}
                      stopOpacity={0.16}
                    />

                    <stop
                      offset="55%"
                      stopColor={colors.net}
                      stopOpacity={0.06}
                    />

                    <stop
                      offset="100%"
                      stopColor={colors.net}
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
                  width={46}
                  tick={{
                    fill: colors.foregroundMuted,
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) =>
                    compact(Number(value))
                  }
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

                    const point = data.find(
                      (item) =>
                        String(item.label) === String(label),
                    );

                    return (
                      <div className="min-w-52 rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur">
                        <p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-foreground">
                          {t(`common.${point?.key ?? "day"}`)}{" "}
                          {point?.label ?? label}
                        </p>

                        <div className="space-y-1">
                          {Array.from(
                            payload.reduce((entries, item) => {
                              const key = String(item.dataKey ?? item.name ?? "");
                              if (key) {
                                entries.set(key, item);
                              }
                              return entries;
                            }, new Map<string, (typeof payload)[number]>()),
                          ).map(([key, item]) => (
                            <div
                              key={`cash-flow-tooltip-${key}`}
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
                                  {series.find((entry) => entry.key === key)?.label ?? item.name}
                                </span>
                              </span>

                              <strong className="shrink-0 text-foreground">
                                {formatAmount(
                                  Number(item.value ?? 0),
                                  "₫",
                                  locale,
                                )}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Vùng màu mềm bên dưới line Thu */}
                <Area
                  key="cash-flow-area-income"
                  type="monotone"
                  dataKey="income"
                  fill={`url(#${gradientPrefix}-income)`}
                  stroke="none"
                  baseValue={0}
                  hide={!visible.income}
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={animationDuration}
                  animationEasing="ease-out"
                />

                {/* Vùng màu mềm bên dưới line Chi */}
                <Area
                  key="cash-flow-area-expense"
                  type="monotone"
                  dataKey="expense"
                  fill={`url(#${gradientPrefix}-expense)`}
                  stroke="none"
                  baseValue={0}
                  hide={!visible.expense}
                  isAnimationActive
                  animationBegin={100}
                  animationDuration={animationDuration + 100}
                  animationEasing="ease-out"
                />

                {/* Vùng màu mềm bên dưới line Ròng */}
                <Area
                  key="cash-flow-area-net"
                  type="monotone"
                  dataKey="net"
                  fill={`url(#${gradientPrefix}-net)`}
                  stroke="none"
                  baseValue={0}
                  hide={!visible.net}
                  isAnimationActive
                  animationBegin={200}
                  animationDuration={animationDuration + 150}
                  animationEasing="ease-out"
                />

                {/* Line Thu */}
                <Line
                  key="cash-flow-line-income"
                  type="monotone"
                  dataKey="income"
                  name={t("cashFlow.incomeShort")}
                  stroke={colors.income}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: colors.income,
                    stroke: colors.background,
                    strokeWidth: 3,
                  }}
                  hide={!visible.income}
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={animationDuration}
                  animationEasing="ease-out"
                />

                {/* Line Chi */}
                <Line
                  key="cash-flow-line-expense"
                  type="monotone"
                  dataKey="expense"
                  name={t("cashFlow.expenseShort")}
                  stroke={colors.expense}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: colors.expense,
                    stroke: colors.background,
                    strokeWidth: 3,
                  }}
                  hide={!visible.expense}
                  isAnimationActive
                  animationBegin={120}
                  animationDuration={animationDuration + 100}
                  animationEasing="ease-out"
                />

                {/* Line Ròng */}
                <Line
                  key="cash-flow-line-net"
                  type="monotone"
                  dataKey="net"
                  name={t("cashFlow.netShort")}
                  stroke={colors.net}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: colors.net,
                    stroke: colors.background,
                    strokeWidth: 3,
                  }}
                  hide={!visible.net}
                  isAnimationActive
                  animationBegin={240}
                  animationDuration={animationDuration + 150}
                  animationEasing="ease-out"
                />

                {shouldShowBrush ? (
                  <Brush
                    dataKey="label"
                    height={24}
                    stroke={colors.net}
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