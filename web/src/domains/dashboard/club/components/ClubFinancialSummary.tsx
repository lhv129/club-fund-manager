import { ArrowDownLeft, ArrowUpRight, Banknote, ReceiptText } from "lucide-react";
import type { DashboardCashFlowPoint, DashboardContribution } from "../types";
import { formatAmount } from "@/utils";

export function ClubFinancialSummary({ cashFlow, contributions, transactionTotal, locale }: { cashFlow: DashboardCashFlowPoint[]; contributions: DashboardContribution[]; transactionTotal: number; locale: string }) {
  const income = cashFlow.reduce((sum, point) => sum + point.income, 0);
  const expense = cashFlow.reduce((sum, point) => sum + point.expense, 0);
  const outstanding = contributions.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.amount), 0);
  const items = [
    { label: "Tổng thu", value: income, detail: `${transactionTotal} giao dịch trong kỳ`, icon: ArrowDownLeft, tone: "text-emerald-500 bg-emerald-500/10" },
    { label: "Tổng chi", value: expense, detail: "Chi phí trong khoảng lọc", icon: ArrowUpRight, tone: "text-red-500 bg-red-500/10" },
    { label: "Dòng tiền ròng", value: income - expense, detail: "Tổng thu trừ tổng chi", icon: Banknote, tone: "text-primary bg-primary/10" },
    { label: "Còn phải thu", value: outstanding, detail: `${contributions.filter((item) => item.status === "pending").length} khoản đang chờ`, icon: ReceiptText, tone: "text-amber-500 bg-amber-500/10" },
  ];
  return <section aria-label="Tổng quan tài chính" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"><div className="flex items-center justify-between border-b border-border bg-background-subtle/60 px-4 py-3.5"><p className="text-sm font-medium text-foreground-muted">{label}</p><span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}><Icon className="size-[18px]" /></span></div><div className="px-4 py-4"><p className="text-xl font-bold text-foreground sm:text-2xl">{formatAmount(value, "₫", locale)}</p><p className="mt-2 text-xs text-foreground-muted">{detail}</p></div></article>)}</section>;
}
