"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Brush,
} from "recharts";
import {
  CalendarRange,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import type {
  DashboardContributionSummary,
  DashboardSession,
  DashboardSessionChartRow,
  DashboardSessionSummary,
  DashboardSessionTooltipItem,
  DashboardTransactionSummary,
  DashboardPieTooltipItem,
} from "../types";
import { formatAmount } from "@/utils";
import { DashboardCard, DashboardState } from "./DashboardCard";
import "./_group.css";

const CONTRIBUTION_COLORS = [
  "var(--chart-income)",
  "var(--chart-groups)",
  "var(--chart-muted)",
];

const TRANSACTION_COLORS = [
  "var(--chart-male)",
  "var(--chart-income)",
];

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: DashboardPieTooltipItem[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-xl border border-border bg-background p-3 shadow-xl">
      <p className="text-xs font-semibold text-foreground">
        {item.name}
      </p>

      <p className="mt-1 text-lg font-bold text-[var(--chart-total)]">
        {item.value}
      </p>

      {item.payload?.amount !== undefined && (
        <p className="text-xs text-foreground-muted">
          {formatAmount(item.payload.amount, "₫")}
        </p>
      )}
    </div>
  );
}

function DonutCenter({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-foreground">
          {value}
        </p>

        <p className="text-[11px] text-foreground-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

export function ContributionStatusChart({
  summary,
}: {
  summary: DashboardContributionSummary;
}) {
  const t = useTranslations("clubDashboard");

  const chartData = useMemo(
    () => [
      {
        name: t("fund.statusPaid"),
        value: summary.paid,
      },
      {
        name: t("fund.statusPending"),
        value: summary.pending,
      },
      {
        name: t("fund.statusCancelled"),
        value: summary.cancelled,
      },
    ],
    [summary, t],
  );

  return (
    <DashboardCard
      icon={CircleDollarSign}
      title={t("fund.distribution")}
      description={t("fund.contributionStatusDescription")}
    >
      {!summary.total ? (
        <DashboardState
          message={t("fund.noContributionData")}
        />
      ) : (
        <div className="relative h-80 p-3">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="80%"
                paddingAngle={4}
                cornerRadius={7}
                animationBegin={100}
                animationDuration={900}
              >
                {chartData.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={CONTRIBUTION_COLORS[index]}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>

              <Tooltip content={<PieTooltip />} />

              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <DonutCenter
            value={summary.total}
            label={t("fund.contributions")}
          />
        </div>
      )}
    </DashboardCard>
  );
}

export function TransactionSourceChart({
  summary,
}: {
  summary: DashboardTransactionSummary;
}) {
  const t = useTranslations("clubDashboard");

  const [activeIndex, setActiveIndex] = useState<
    number | null
  >(null);

  const chartData = useMemo(
    () =>
      [
        {
          key: "cash",
          name: t("transactions.sourceCash"),
          value: summary.cash_count,
          amount: summary.cash_amount,
        },
        {
          key: "bank",
          name: t("transactions.sourceWebhook"),
          value: summary.bank_count,
          amount: summary.bank_amount,
        },
      ],
    [summary, t],
  );

  return (
    <DashboardCard
      icon={ReceiptText}
      title={t("transactions.sources")}
      description={t("transactions.sourceDescription")}
    >
      {!summary.total_count ? (
        <DashboardState
          message={t("transactions.noTransactionData")}
        />
      ) : (
        <div className="relative h-80 p-3">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="54%"
                outerRadius="80%"
                paddingAngle={4}
                cornerRadius={7}
                animationDuration={1000}
                onMouseEnter={(_, index) =>
                  setActiveIndex(index)
                }
                onMouseLeave={() =>
                  setActiveIndex(null)
                }
              >
                {chartData.map((item, index) => {
                  const isVisible =
                    activeIndex === null ||
                    activeIndex === index;

                  return (
                    <Cell
                      key={item.name}
                      fill={TRANSACTION_COLORS[index]}
                      opacity={
                        isVisible ? 1 : 0.35
                      }
                      stroke="var(--background)"
                      strokeWidth={
                        activeIndex === index ? 3 : 2
                      }
                    />
                  );
                })}
              </Pie>

              <Tooltip content={<PieTooltip />} />

              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <DonutCenter
            value={summary.total_count}
            label={t("transactions.transactions")}
          />
        </div>
      )}
    </DashboardCard>
  );
}

function formatCompactAmount(value: number) {
  const absoluteValue = Math.abs(value);
  const prefix = value < 0 ? "-" : "";

  if (absoluteValue >= 1_000_000) {
    const amount = absoluteValue / 1_000_000;

    return `${prefix}${Number.isInteger(amount)
        ? amount
        : amount.toFixed(1)
      }tr`;
  }

  if (absoluteValue >= 1_000) {
    return `${prefix}${Math.round(
      absoluteValue / 1_000,
    )}k`;
  }

  return `${value}`;
}

function SessionScaleSummary({
  summary,
}: {
  summary: DashboardSessionSummary;
}) {
  const t = useTranslations("clubDashboard");

  return (
    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:divide-x sm:divide-border sm:rounded-xl sm:border sm:border-border sm:bg-background-subtle/60">
      <div className="rounded-xl border border-border bg-background-subtle/60 px-3 py-3 sm:rounded-none sm:border-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("sessions.participants")}
        </p>

        <p className="mt-1 truncate text-lg font-bold text-[var(--chart-male)]">
          {summary.totalPlayers}
        </p>

        <p className="mt-0.5 text-[11px] text-foreground-muted">
          {t("sessions.participantCount", {
            count: summary.totalPlayers,
          })}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background-subtle/60 px-3 py-3 sm:rounded-none sm:border-0 sm:pl-5">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("sessions.average")}
        </p>

        <p className="mt-1 truncate text-lg font-bold text-[var(--chart-total)]">
          {summary.averagePlayers
            .toFixed(1)
            .replace(".", ",")}
        </p>

        <p className="mt-0.5 text-[11px] text-foreground-muted">
          {t("sessions.perSession")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background-subtle/60 px-3 py-3 sm:rounded-none sm:border-0 sm:pl-5">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("sessions.busiestSession")}
        </p>

        <p className="mt-1 truncate text-lg font-bold text-[var(--chart-groups)]">
          {summary.peak?.players ?? 0}
        </p>

        <p className="mt-0.5 truncate text-[11px] text-foreground-muted">
          {summary.peak?.name ??
            t("sessions.noData")}
        </p>
      </div>
    </div>
  );
}

function SessionScaleLegend() {
  const t = useTranslations("clubDashboard");

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground-muted">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-[3px] bg-[var(--chart-male)]" />

        <span>
          {t("sessions.participants")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="h-0.5 w-5 rounded-full bg-[var(--chart-groups)]" />

        <span>
          {t("sessions.collectedAmount")}
        </span>
      </div>
    </div>
  );
}

function SessionScaleTooltip({
  active,
  payload,
  label,
  locale,
}: {
  active?: boolean;
  payload?: DashboardSessionTooltipItem[];
  label?: string;
  locale: string;
}) {
  const t = useTranslations("clubDashboard");

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-48 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background/95 p-3.5 shadow-xl backdrop-blur">
      <p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-foreground">
        {t("sessions.tooltipTitle", {
          date: label ?? "",
        })}
      </p>

      <div className="space-y-1">
        {payload.map((item) => {
          const isAmount =
            item.dataKey === "amount";

          return (
            <div
              key={
                item.dataKey ?? item.name
              }
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
                {isAmount
                  ? formatAmount(
                    Number(item.value ?? 0),
                    "₫",
                    locale,
                  )
                  : t(
                    "sessions.participantCount",
                    {
                      count: Number(
                        item.value ?? 0,
                      ),
                    },
                  )}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionScalePlot({
  data,
  locale,
}: {
  data: DashboardSessionChartRow[];
  locale: string;
}) {
  const t = useTranslations("clubDashboard");

  const gradientId = useId().replace(
    /:/g,
    "",
  );

  const isDenseData = data.length > 10;
  const shouldShowBrush = data.length > 10;

  const xAxisInterval =
    data.length <= 6
      ? 0
      : "preserveStartEnd";

  const chartHeightClass = isDenseData
    ? "h-[300px] sm:h-[350px] lg:h-[390px]"
    : "h-[270px] sm:h-[320px] lg:h-[350px]";

  const animationDuration = isDenseData
    ? 600
    : 900;

  return (
    <div className="mt-1">
      <SessionScaleLegend />

      <div className={chartHeightClass}>
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <ComposedChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 8,
              left: -18,
              bottom: shouldShowBrush
                ? 8
                : 2,
            }}
          >
            <defs>
              <linearGradient
                id={`${gradientId}-players`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--chart-male)"
                  stopOpacity={0.95}
                />

                <stop
                  offset="100%"
                  stopColor="var(--chart-male)"
                  stopOpacity={0.7}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 6"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              interval={xAxisInterval}
              minTickGap={
                isDenseData ? 28 : 16
              }
              tick={{
                fill: "var(--foreground-muted)",
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              yAxisId="players"
              allowDecimals={false}
              width={34}
              tick={{
                fill: "var(--foreground-muted)",
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              yAxisId="amount"
              orientation="right"
              width={42}
              tick={{
                fill: "var(--foreground-muted)",
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                formatCompactAmount(
                  Number(value),
                )
              }
            />

            <Tooltip
              cursor={{
                fill: "var(--background-muted)",
                opacity: 0.28,
              }}
              content={
                <SessionScaleTooltip
                  locale={locale}
                />
              }
            />

            <Bar
              yAxisId="players"
              dataKey="players"
              name={t(
                "sessions.participants",
              )}
              fill={`url(#${gradientId}-players)`}
              radius={[7, 7, 2, 2]}
              maxBarSize={
                isDenseData ? 22 : 34
              }
              animationBegin={0}
              animationDuration={
                animationDuration
              }
              animationEasing="ease-out"
            />

            <Line
              yAxisId="amount"
              type="monotone"
              dataKey="amount"
              name={t(
                "sessions.collectedAmount",
              )}
              stroke="var(--chart-groups)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{
                r: 5,
                fill: "var(--chart-groups)",
                stroke:
                  "var(--background)",
                strokeWidth: 3,
              }}
              animationBegin={140}
              animationDuration={
                animationDuration + 100
              }
              animationEasing="ease-out"
            />

            {shouldShowBrush ? (
              <Brush
                dataKey="name"
                height={24}
                stroke="var(--chart-groups)"
                fill="var(--background-subtle)"
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

function SessionScaleFooter({
  summary,
}: {
  summary: DashboardSessionSummary;
}) {
  const t = useTranslations("clubDashboard");

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
      <span>
        {t("sessions.totalCollected")}:{" "}
        <strong className="font-semibold text-foreground">
          {formatAmount(
            summary.totalAmount,
            "₫",
          )}
        </strong>
      </span>

      <span>
        {t("sessions.highest")}:{" "}
        <strong className="font-semibold text-foreground">
          {summary.peak?.name ?? "—"}
        </strong>
      </span>
    </div>
  );
}

export function SessionScaleChart({
  data,
  locale,
}: {
  data: DashboardSession[];
  locale: string;
}) {
  const t = useTranslations("clubDashboard");

  const chartData =
    useMemo<DashboardSessionChartRow[]>(
      () =>
        data.map((session) => ({
          name: session.session_date
            .slice(5)
            .split("-")
            .reverse()
            .join("/"),
          players: session.player_count,
          amount: Number(
            session.total_amount,
          ),
        })),
      [data],
    );

  const summary =
    useMemo<DashboardSessionSummary>(() => {
      if (!chartData.length) {
        return {
          totalPlayers: 0,
          totalAmount: 0,
          averagePlayers: 0,
          peak: undefined,
        };
      }

      return {
        totalPlayers: chartData.reduce(
          (sum, item) =>
            sum + item.players,
          0,
        ),
        totalAmount: chartData.reduce(
          (sum, item) =>
            sum + item.amount,
          0,
        ),
        averagePlayers:
          chartData.reduce(
            (sum, item) =>
              sum + item.players,
            0,
          ) / chartData.length,
        peak: chartData.reduce(
          (peak, item) =>
            item.players > peak.players
              ? item
              : peak,
        ),
      };
    }, [chartData]);

  return (
    <DashboardCard
      icon={CalendarRange}
      title={t("sessions.title")}
      description={t("sessions.description")}
    >
      {!data.length ? (
        <DashboardState
          message={t("sessions.noSessionData")}
        />
      ) : (
        <div className="p-4 sm:p-5">
          <SessionScaleSummary
            summary={summary}
          />

          <SessionScalePlot
            data={chartData}
            locale={locale}
          />

          <SessionScaleFooter
            summary={summary}
          />
        </div>
      )}
    </DashboardCard>
  );
}
