import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ReceiptText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  DashboardCashFlowPoint,
  DashboardContribution,
} from "../types";
import { formatAmount } from "@/utils";

export function ClubFinancialSummary({
  cashFlow,
  contributions,
  transactionTotal,
  fundBalance,
  locale,
}: {
  cashFlow: DashboardCashFlowPoint[];
  contributions: DashboardContribution[];
  transactionTotal: number;
  fundBalance: number;
  locale: string;
}) {
  const t = useTranslations("clubDashboard");

  const income = cashFlow.reduce(
    (sum, point) => sum + point.income,
    0,
  );

  const expense = cashFlow.reduce(
    (sum, point) => sum + point.expense,
    0,
  );

  const outstanding = fundBalance;

  const items = [
    {
      label: t("financial.income"),
      value: income,
      detail: t("financial.transactionsInPeriod", {
        count: transactionTotal,
      }),
      icon: ArrowDownLeft,
      tone: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: t("financial.expense"),
      value: expense,
      detail: t("financial.expenseInRange"),
      icon: ArrowUpRight,
      tone: "text-red-500 bg-red-500/10",
    },
    {
      label: t("financial.netCashFlow"),
      value: income - expense,
      detail: t("financial.incomeMinusExpense"),
      icon: Banknote,
      tone: "text-primary bg-primary/10",
    },
    {
      label: t("financial.outstanding"),
      value: outstanding,
      detail: t("financial.pendingContributions", {
        count: contributions.filter(
          (item) => item.status === "pending",
        ).length,
      }),
      icon: ReceiptText,
      tone: "text-amber-500 bg-amber-500/10",
    },
  ];

  return (
    <section aria-label={t("financial.title")} className="space-y-3.5">
      {/* <h2 className="text-sm font-semibold tracking-wide text-foreground">
        {t("financial.title")}
      </h2> */}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ label, value, detail, icon: Icon, tone }) => (
          <article
            key={label}
            className="group rounded-2xl border border-border bg-background p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground-muted">
                  {label}
                </p>
                <p className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-5 text-foreground-muted">
                  {detail}
                </p>
              </div>

              <span
                aria-hidden="true"
                className={"flex size-10 shrink-0 items-center justify-center rounded-xl " + tone + " transition-transform duration-200 group-hover:scale-105"}
              >
                <Icon className="size-[18px]" strokeWidth={1.8} />
              </span>
            </div>

            <p className="mt-5 truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-[1.75rem]">
              {formatAmount(value, "₫", locale)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}