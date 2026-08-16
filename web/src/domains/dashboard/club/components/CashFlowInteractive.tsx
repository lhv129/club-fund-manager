"use client";

import { useMemo, useState } from "react";
import { BarChart3, Info, RotateCcw } from "lucide-react";
import {
  Area,
  Bar,
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
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

export function CashFlowInteractive({ data, locale }: { data: DashboardCashFlowPoint[]; locale: string }) {
  const colors = useDashboardChartColors();
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({ income: true, expense: true, net: true });
  const totals = useMemo(() => data.reduce((sum, point) => ({
    income: sum.income + point.income,
    expense: sum.expense + point.expense,
    net: sum.net + point.net,
  }), { income: 0, expense: 0, net: 0 }), [data]);
  const series = [
    { key: "income" as const, label: "Thu", color: colors.income },
    { key: "expense" as const, label: "Chi", color: colors.expense },
    { key: "net" as const, label: "Ròng", color: colors.net },
  ];
  const reset = () => setVisible({ income: true, expense: true, net: true });

  return (
    <DashboardCard icon={BarChart3} title="Dòng tiền" description="Theo dõi thu, chi và dòng tiền ròng trong khoảng lọc">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-foreground-muted"><Info className="size-3.5" />Dữ liệu theo khoảng thời gian ở phần đầu trang</div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {series.map((item) => <button key={item.key} type="button" aria-pressed={visible[item.key]} onClick={() => setVisible((current) => ({ ...current, [item.key]: !current[item.key] }))} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-opacity ${visible[item.key] ? "border-border text-foreground" : "border-transparent text-foreground-muted opacity-40 line-through"}`}><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</button>)}
          <button type="button" onClick={reset} title="Đặt lại series" aria-label="Đặt lại series" className="flex size-7 items-center justify-center rounded-full text-foreground-muted hover:bg-background-muted hover:text-foreground"><RotateCcw className="size-3.5" /></button>
        </div>
      </div>
      <div className="grid divide-y divide-border border-b border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {series.map((item) => <div key={item.key} className="min-w-0 px-4 py-4 sm:px-6"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</p><p className="mt-1 truncate text-base font-bold" style={{ color: item.color }}>{formatAmount(totals[item.key], "₫", locale)}</p></div>)}
      </div>
      {!data.length ? <DashboardState message="Chưa có dữ liệu trong khoảng thời gian này." /> : <div className="h-[310px] w-full px-2 pb-2 pt-5 sm:h-[380px] sm:px-6"><ResponsiveContainer width="100%" height="100%"><ComposedChart accessibilityLayer data={data} margin={{ top: 10, right: 8, left: -10, bottom: 4 }}>
        <defs><linearGradient id="cash-flow-income" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.income} stopOpacity={0.22} /><stop offset="100%" stopColor={colors.income} stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid stroke={colors.grid} strokeDasharray="2 5" vertical={false} /><XAxis dataKey="label" tick={{ fill: colors.foregroundMuted, fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={22} /><YAxis tick={{ fill: colors.foregroundMuted, fontSize: 10 }} tickLine={false} axisLine={false} width={44} tickFormatter={(value: number) => compact(Number(value))} /><Tooltip cursor={{ stroke: colors.borderStrong, strokeDasharray: "4 4" }} content={({ active, payload, label }) => active && payload?.length ? <div className="min-w-52 rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur"><p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-foreground">Ngày {label}</p>{payload.map((item) => <div key={String(item.dataKey ?? item.name)} className="flex items-center justify-between gap-5 py-1 text-xs"><span className="flex items-center gap-2 text-foreground-muted"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><strong className="text-foreground">{formatAmount(Number(item.value ?? 0), "₫", locale)}</strong></div>)}</div> : null} />
        <Area type="monotone" dataKey="income" name="Thu" fill="url(#cash-flow-income)" stroke={colors.income} strokeWidth={2.5} hide={!visible.income} animationDuration={900} /><Bar dataKey="expense" name="Chi" fill={colors.expense} radius={[7, 7, 2, 2]} maxBarSize={26} hide={!visible.expense} animationBegin={160} animationDuration={900} /><Line type="monotone" dataKey="net" name="Ròng" stroke={colors.net} strokeWidth={3} dot={{ r: 3, fill: colors.background, stroke: colors.net, strokeWidth: 2 }} activeDot={{ r: 6, fill: colors.net, stroke: colors.background, strokeWidth: 3 }} hide={!visible.net} animationBegin={280} animationDuration={1000} />
        <Brush dataKey="label" height={24} stroke={colors.net} fill={colors.backgroundSubtle} travellerWidth={9} tickFormatter={() => ""} />
      </ComposedChart></ResponsiveContainer></div>}
    </DashboardCard>
  );
}
