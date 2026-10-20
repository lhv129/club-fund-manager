"use client";

import { ArrowDownLeft, ArrowUpRight, CalendarClock, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn, formatAmount, formatDateTime } from "@/utils";
import type { Transaction } from "@/domains/transaction/types";
import { CopyAction } from "@/components/shared/ui/button/copy/CopyAction";

interface TransactionDetailHeroProps {
    transaction: Transaction;
}

export function TransactionDetailHero({ transaction }: TransactionDetailHeroProps) {
    const locale = useLocale();
    const tt = useTranslations("transaction");

    const isIncome = transaction.type === "income";
    const FlowIcon = isIncome ? ArrowDownLeft : ArrowUpRight;

    const sourceLabel = transaction.source
        ? tt(`source${transaction.source.charAt(0).toUpperCase()}${transaction.source.slice(1)}`)
        : null;

    return (
        <section
            className={cn(
                "relative isolate overflow-hidden rounded-3xl px-5 py-7 sm:px-8 sm:py-9",
                "ring-1 ring-inset",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.98] motion-safe:duration-500",
                isIncome
                    ? "bg-gradient-to-br from-emerald-500/[0.09] via-background to-background ring-emerald-500/15"
                    : "bg-gradient-to-br from-rose-500/[0.09] via-background to-background ring-rose-500/15",
            )}
        >
            {/* soft ambient glow — decoration only */}
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full blur-3xl",
                    isIncome ? "bg-emerald-400/15" : "bg-rose-400/15",
                )}
            />

            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                {/* Left: what happened + how much */}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                                isIncome
                                    ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                                    : "bg-rose-500/12 text-rose-700 dark:text-rose-400",
                            )}
                        >
                            <FlowIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                            {tt(transaction.type)}
                        </span>

                        {sourceLabel && (
                            <span className="inline-flex items-center rounded-full bg-foreground/[0.05] px-2.5 py-1 text-xs font-medium text-foreground-muted">
                                {sourceLabel}
                            </span>
                        )}
                    </div>

                    <p className="mt-5 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                        {tt("amount")}
                    </p>
                    <p
                        className={cn(
                            "mt-1 text-4xl font-semibold leading-none tracking-tight tabular-nums sm:text-5xl",
                            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                        )}
                    >
                        {isIncome ? "+" : "−"}
                        {formatAmount(transaction.amount, "đ", locale)}
                    </p>

                    {transaction.description && (
                        <p className="mt-4 line-clamp-2 max-w-xl text-sm leading-relaxed text-foreground">
                            {transaction.description}
                        </p>
                    )}
                </div>

                {/* Right: meta, separated by a hairline instead of a box */}
                <dl className="grid shrink-0 gap-3 border-t border-border/60 pt-5 text-sm sm:grid-cols-2 lg:min-w-[240px] lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                    <div className="flex items-center gap-2.5">
                        <CalendarClock className="h-4 w-4 shrink-0 text-foreground-muted" />
                        <div className="min-w-0">
                            <dt className="sr-only">{tt("transactionDate")}</dt>
                            <dd className="truncate font-medium text-foreground">
                                {formatDateTime(transaction.transaction_date, locale)}
                            </dd>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Wallet className="h-4 w-4 shrink-0 text-foreground-muted" />
                        <div className="flex min-w-0 items-baseline gap-1.5">
                            <dt className="text-foreground-muted">{tt("balance")}</dt>
                            <dd className="truncate font-semibold tabular-nums text-foreground">
                                {formatAmount(transaction.balance, "đ", locale)}
                            </dd>
                        </div>
                    </div>

                    {transaction.reference_code && (
                        <div className="flex items-center gap-1 sm:col-span-2 lg:col-span-1">
                            <dt className="sr-only">{tt("referenceCode")}</dt>
                            <dd className="min-w-0 truncate font-mono text-xs text-foreground-muted">
                                #{transaction.reference_code}
                            </dd>
                            <CopyAction value={transaction.reference_code} className="h-6 w-6" />
                        </div>
                    )}
                </dl>
            </div>
        </section>
    );
}
