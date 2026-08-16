"use client";

import { useMemo, useState } from "react";
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
} from "recharts";
import {
  CalendarRange,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import type {
  DashboardContribution,
  DashboardSession,
  DashboardTransaction,
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
  "var(--chart-net)",
];

type PieTooltipItem = {
  name?: string;
  value?: number;
  payload?: {
    amount?: number;
  };
};

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PieTooltipItem[];
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
  data,
}: {
  data: DashboardContribution[];
}) {
  const chartData = useMemo(
    () => [
      {
        name: "Đã đóng",
        value: data.filter((item) => item.status === "paid").length,
        amount: data
          .filter((item) => item.status === "paid")
          .reduce((sum, item) => sum + Number(item.amount), 0),
      },
      {
        name: "Đang chờ",
        value: data.filter((item) => item.status === "pending").length,
        amount: data
          .filter((item) => item.status === "pending")
          .reduce((sum, item) => sum + Number(item.amount), 0),
      },
      {
        name: "Đã hủy",
        value: data.filter((item) => item.status === "cancelled").length,
        amount: data
          .filter((item) => item.status === "cancelled")
          .reduce((sum, item) => sum + Number(item.amount), 0),
      },
    ],
    [data],
  );

  return (
    <DashboardCard
      icon={CircleDollarSign}
      title="Phân bổ đóng quỹ"
      description="Số khoản theo trạng thái hiện tại"
    >
      {!data.length ? (
        <DashboardState message="Chưa có dữ liệu khoản đóng." />
      ) : (
        <div className="relative h-80 p-3">
          <ResponsiveContainer width="100%" height="100%">
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
            value={data.length}
            label="khoản đóng"
          />
        </div>
      )}
    </DashboardCard>
  );
}

export function TransactionSourceChart({
  data,
}: {
  data: DashboardTransaction[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    null,
  );

  const chartData = useMemo(
    () =>
      [
        {
          key: "webhook",
          name: "Webhook",
        },
        {
          key: "cash",
          name: "Tiền mặt",
        },
        {
          key: "manual",
          name: "Thủ công",
        },
      ].map((source) => ({
        ...source,
        value: data.filter((item) => item.source === source.key)
          .length,
      })),
    [data],
  );

  return (
    <DashboardCard
      icon={ReceiptText}
      title="Nguồn giao dịch"
      description="Tỷ trọng giao dịch theo nguồn ghi nhận"
    >
      {!data.length ? (
        <DashboardState message="Chưa có dữ liệu giao dịch." />
      ) : (
        <div className="relative h-80 p-3">
          <ResponsiveContainer width="100%" height="100%">
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
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((item, index) => {
                  const isVisible =
                    activeIndex === null || activeIndex === index;

                  return (
                    <Cell
                      key={item.name}
                      fill={TRANSACTION_COLORS[index]}
                      opacity={isVisible ? 1 : 0.35}
                      stroke="var(--background)"
                      strokeWidth={activeIndex === index ? 3 : 2}
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
            value={data.length}
            label="giao dịch"
          />
        </div>
      )}
    </DashboardCard>
  );
}

type SessionChartRow = {
  name: string;
  players: number;
  amount: number;
};

type SessionTooltipItem = {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
};

function formatCompactAmount(value: number) {
  if (value >= 1_000_000) {
    const amount = value / 1_000_000;

    return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}tr`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }

  return `${value}`;
}

function SessionTooltip({
  active,
  payload,
  label,
  locale,
}: {
  active?: boolean;
  payload?: SessionTooltipItem[];
  label?: string;
  locale: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-52 rounded-2xl border border-border bg-background/95 p-3.5 shadow-xl backdrop-blur">
      <p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-foreground">
        Buổi đánh · {label}
      </p>

      <div className="space-y-1">
        {payload.map((item) => {
          const isAmount = item.dataKey === "amount";

          return (
            <div
              key={item.dataKey ?? item.name}
              className="flex items-center justify-between gap-5 py-1 text-xs"
            >
              <span className="flex items-center gap-2 text-foreground-muted">
                <span
                  className="size-2 rounded-full"
                  style={{ background: item.color }}
                />
                {item.name}
              </span>

              <strong className="text-foreground">
                {isAmount
                  ? formatAmount(
                    Number(item.value ?? 0),
                    "₫",
                    locale,
                  )
                  : `${Number(item.value ?? 0)} người`}
              </strong>
            </div>
          );
        })}
      </div>
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
  const chartData = useMemo<SessionChartRow[]>(
    () =>
      data.map((session) => ({
        name: session.session_date
          .slice(5)
          .split("-")
          .reverse()
          .join("/"),
        players: session.player_count,
        amount: Number(session.total_amount),
      })),
    [data],
  );

  const summary = useMemo(() => {
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
        (sum, item) => sum + item.players,
        0,
      ),
      totalAmount: chartData.reduce(
        (sum, item) => sum + item.amount,
        0,
      ),
      averagePlayers:
        chartData.reduce(
          (sum, item) => sum + item.players,
          0,
        ) / chartData.length,
      peak: chartData.reduce((peak, item) =>
        item.players > peak.players ? item : peak,
      ),
    };
  }, [chartData]);

  return (
    <DashboardCard
      icon={CalendarRange}
      title="Quy mô buổi đánh"
      description="Theo dõi số người tham gia và chi phí từng buổi"
    >
      {!data.length ? (
        <DashboardState message="Chưa có dữ liệu buổi đánh." />
      ) : (
        <div className="p-4 sm:p-5">
          <div className="mb-4 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background-subtle/60">
            <div className="min-w-0 px-3 py-3">
              <p className="truncate text-[10px] font-semibold uppercase text-foreground-muted">
                Tổng người
              </p>

              <p className="mt-1 truncate text-base font-bold text-[var(--chart-male)]">
                {summary.totalPlayers}
              </p>
            </div>

            <div className="min-w-0 px-3 py-3">
              <p className="truncate text-[10px] font-semibold uppercase text-foreground-muted">
                Trung bình
              </p>

              <p className="mt-1 truncate text-base font-bold text-[var(--chart-total)]">
                {summary.averagePlayers
                  .toFixed(1)
                  .replace(".", ",")}
              </p>
            </div>

            <div className="min-w-0 px-3 py-3">
              <p className="truncate text-[10px] font-semibold uppercase text-foreground-muted">
                Buổi đông nhất
              </p>

              <p className="mt-1 truncate text-base font-bold text-[var(--chart-groups)]">
                {summary.peak?.players ?? 0}
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -18,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 6"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "var(--foreground-muted)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  yAxisId="players"
                  allowDecimals={false}
                  tick={{
                    fill: "var(--foreground-muted)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  yAxisId="amount"
                  orientation="right"
                  tick={{
                    fill: "var(--foreground-muted)",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                  tickFormatter={(value: number) =>
                    formatCompactAmount(Number(value))
                  }
                />

                <Tooltip
                  content={<SessionTooltip locale={locale} />}
                  cursor={{
                    fill: "color-mix(in srgb, var(--background-muted) 35%, transparent)",
                  }}
                />

                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                />

                <Bar
                  yAxisId="players"
                  dataKey="players"
                  name="Người tham gia"
                  fill="var(--chart-male)"
                  radius={[7, 7, 2, 2]}
                  maxBarSize={30}
                  animationDuration={900}
                />

                <Line
                  yAxisId="amount"
                  type="monotone"
                  dataKey="amount"
                  name="Chi phí"
                  stroke="var(--chart-groups)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: "var(--background)",
                    stroke: "var(--chart-groups)",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "var(--chart-groups)",
                    stroke: "var(--background)",
                    strokeWidth: 3,
                  }}
                  animationBegin={180}
                  animationDuration={1000}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-foreground-muted">
            <span>
              Tổng chi phí:{" "}
              <strong className="font-semibold text-foreground">
                {formatAmount(
                  summary.totalAmount,
                  "₫",
                  locale,
                )}
              </strong>
            </span>

            <span>
              Cao nhất:{" "}
              <strong className="font-semibold text-foreground">
                {summary.peak?.name ?? "—"}
              </strong>
            </span>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
