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

type CashFlowSeries = {
  key: SeriesKey;
  label: string;
  color: string;
};

function compact(value: number) {
  const absoluteValue = Math.abs(value);
  const prefix = value < 0 ? "-" : "";

  if (absoluteValue >= 1_000_000) {
    return `${prefix}${(
      absoluteValue / 1_000_000
    ).toFixed(
      absoluteValue % 1_000_000 ? 1 : 0,
    )}tr`;
  }

  if (absoluteValue >= 1_000) {
    return `${prefix}${Math.round(
      absoluteValue / 1_000,
    )}k`;
  }

  return `${value}`;
}

function CashFlowControls({
  series,
  visible,
  chartInfo,
  resetLabel,
  onToggle,
  onReset,
}: {
  series: CashFlowSeries[];
  visible: Record<SeriesKey, boolean>;
  chartInfo: string;
  resetLabel: string;
  onToggle: (key: SeriesKey) => void;
  onReset: () => void;
}) {
  return (
    <div className="px-4 pb-2 pt-4 sm:px-6">
      <div className="flex flex-col gap-3 rounded-xl bg-background-subtle/45 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2 text-xs text-foreground-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />

          <span className="leading-5">
            {chartInfo}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          {series.map((item) => {
            const isVisible = visible[item.key];

            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isVisible}
                onClick={() => onToggle(item.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all ${isVisible
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-foreground-muted opacity-50 hover:opacity-80"
                  }`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: item.color,
                  }}
                />

                <span
                  className={
                    isVisible
                      ? ""
                      : "line-through"
                  }
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onReset}
            title={resetLabel}
            aria-label={resetLabel}
            className="flex size-8 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CashFlowSummary({
  series,
  totals,
  locale,
}: {
  series: CashFlowSeries[];
  totals: Record<SeriesKey, number>;
  locale: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 px-4 py-2 sm:grid-cols-3 sm:px-6">
      {series.map((item) => (
        <div
          key={item.key}
          className="min-w-0 rounded-xl bg-background-subtle/55 px-3.5 py-3 transition-colors hover:bg-background-subtle sm:px-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              <span className="truncate">
                {item.label}
              </span>
            </p>

            <span
              className="h-0.5 w-5 shrink-0 rounded-full opacity-70"
              style={{
                backgroundColor: item.color,
              }}
            />
          </div>

          <p
            className="mt-1.5 truncate text-base font-bold sm:text-lg"
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
  );
}

function CashFlowTooltip({
  active,
  payload,
  label,
  data,
  series,
  locale,
  titleForPeriod,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string | number;
  data: DashboardCashFlowPoint[];
  series: CashFlowSeries[];
  locale: string;
  titleForPeriod: (key: string) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = data.find(
    (item) =>
      String(item.label) === String(label),
  );

  const uniqueItems = series
    .map((entry) =>
      payload.find(
        (item) =>
          String(item.dataKey) === entry.key,
      ),
    )
    .filter(Boolean);

  return (
    <div className="min-w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background/95 p-3.5 shadow-xl backdrop-blur">
      <p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-foreground">
        {titleForPeriod(point?.key ?? "day")}{" "}
        {point?.label ?? label}
      </p>

      <div className="space-y-1">
        {uniqueItems.map((item) => {
          if (!item) {
            return null;
          }

          const itemKey = String(item.dataKey);

          const itemSeries = series.find(
            (entry) => entry.key === itemKey,
          );

          return (
            <div
              key={`cash-flow-tooltip-${itemKey}`}
              className="flex items-center justify-between gap-5 py-1 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground-muted">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      item.color ??
                      itemSeries?.color,
                  }}
                />

                <span className="truncate">
                  {itemSeries?.label ?? item.name}
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
          );
        })}
      </div>
    </div>
  );
}

function CashFlowChart({
  data,
  locale,
  series,
  visible,
  colors,
  gradientPrefix,
  isDenseData,
  shouldShowBrush,
  xAxisInterval,
  chartHeightClass,
  animationDuration,
  titleForPeriod,
}: {
  data: DashboardCashFlowPoint[];
  locale: string;
  series: CashFlowSeries[];
  visible: Record<SeriesKey, boolean>;
  colors: ReturnType<
    typeof useDashboardChartColors
  >;
  gradientPrefix: string;
  isDenseData: boolean;
  shouldShowBrush: boolean;
  xAxisInterval: number | "preserveStartEnd";
  chartHeightClass: string;
  animationDuration: number;
  titleForPeriod: (key: string) => string;
}) {
  return (
    <div className="w-full px-2 pb-2 pt-4 sm:px-6 sm:pt-5">
      <div className="mb-2 flex items-center justify-between gap-3 px-1 text-[11px] text-foreground-muted">
        <span>
          {isDenseData
            ? "Dùng thanh kéo bên dưới để xem chi tiết từng mốc"
            : "Di chuột lên đường biểu diễn để xem chi tiết"}
        </span>

        <span className="shrink-0">
          {data.length} mốc dữ liệu
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
              content={
                <CashFlowTooltip
                  data={data}
                  series={series}
                  locale={locale}
                  titleForPeriod={titleForPeriod}
                />
              }
            />

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

            <Line
              key="cash-flow-line-income"
              type="monotone"
              dataKey="income"
              name={series[0].label}
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

            <Line
              key="cash-flow-line-expense"
              type="monotone"
              dataKey="expense"
              name={series[1].label}
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

            <Line
              key="cash-flow-line-net"
              type="monotone"
              dataKey="net"
              name={series[2].label}
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
  );
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

  const series: CashFlowSeries[] = [
    {
      key: "income",
      label: t("cashFlow.incomeShort"),
      color: colors.income,
    },
    {
      key: "expense",
      label: t("cashFlow.expenseShort"),
      color: colors.expense,
    },
    {
      key: "net",
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

  const toggleSeries = (key: SeriesKey) => {
    setVisible((current) => ({
      ...current,
      [key]: !current[key],
    }));
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

  const animationDuration = isDenseData
    ? 650
    : 900;

  return (
    <DashboardCard
      icon={BarChart3}
      title={t("cashFlow.title")}
      description={t("cashFlow.description")}
    >
      <CashFlowControls
        series={series}
        visible={visible}
        chartInfo={t("cashFlow.chartInfo")}
        resetLabel={t("cashFlow.resetSeries")}
        onToggle={toggleSeries}
        onReset={reset}
      />

      <CashFlowSummary
        series={series}
        totals={totals}
        locale={locale}
      />

      {!data.length ? (
        <DashboardState message={t("common.noDataRange")} />
      ) : (
        <CashFlowChart
          data={data}
          locale={locale}
          series={series}
          visible={visible}
          colors={colors}
          gradientPrefix={gradientPrefix}
          isDenseData={isDenseData}
          shouldShowBrush={shouldShowBrush}
          xAxisInterval={xAxisInterval}
          chartHeightClass={chartHeightClass}
          animationDuration={animationDuration}
          titleForPeriod={(key) =>
            t(`common.${key}`)
          }
        />
      )}
    </DashboardCard>
  );
}