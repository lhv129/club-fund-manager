"use client";

import { CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/shared/ui/Badge";
import type { ContributionStatus } from "@/domains/monthlyContribution/types";

export function ContributionHero({ amount, period, status, statusLabel }: { amount: string; period: string; status: ContributionStatus; statusLabel: string }) {
    const StatusIcon = status === "paid" ? CheckCircle2 : status === "cancelled" ? XCircle : Clock3;
    return (
        <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-background to-background px-5 py-5 shadow-sm sm:px-7 sm:py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground-muted"><StatusIcon className="h-4 w-4 text-primary" /><span>{statusLabel}</span></div>
                    <p className="mt-2 break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{amount}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-foreground-muted"><CalendarDays className="h-4 w-4" />{period}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:max-w-52 sm:justify-end">
                    <Badge variant={status === "paid" ? "active" : status === "cancelled" ? "cancelled" : "pending"} title={statusLabel} />
                </div>
            </div>
        </section>
    );
}
