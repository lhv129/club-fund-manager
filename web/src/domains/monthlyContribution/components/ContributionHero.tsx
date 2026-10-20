"use client";

import { CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Badge } from "@/components/shared/ui/Badge";
import type { ContributionStatus } from "@/domains/monthlyContribution/types";
import { cn } from "@/utils";

interface ContributionHeroProps {
    amount: string;
    period: string;
    status: ContributionStatus;
    statusLabel: string;
}

export function ContributionHero({
    amount,
    period,
    status,
    statusLabel,
}: ContributionHeroProps) {
    const StatusIcon = status === "paid"
        ? CheckCircle2
        : status === "cancelled"
            ? XCircle
            : Clock3;

    const tone = status === "paid"
        ? {
            gradient: "from-emerald-500/[0.09]",
            ring: "ring-emerald-500/15",
            glow: "bg-emerald-400/15",
            icon: "text-emerald-600 dark:text-emerald-400",
            amount: "text-emerald-600 dark:text-emerald-400",
            divider: "border-emerald-500/20",
        }
        : status === "cancelled"
            ? {
                gradient: "from-rose-500/[0.09]",
                ring: "ring-rose-500/15",
                glow: "bg-rose-400/15",
                icon: "text-rose-600 dark:text-rose-400",
                amount: "text-rose-600 dark:text-rose-400",
                divider: "border-rose-500/20",
            }
            : {
                gradient: "from-amber-500/[0.09]",
                ring: "ring-amber-500/15",
                glow: "bg-amber-400/15",
                icon: "text-amber-600 dark:text-amber-400",
                amount: "text-foreground",
                divider: "border-amber-500/20",
            };

    return (
        <section
            className={cn(
                "relative isolate overflow-hidden rounded-3xl px-5 py-6 sm:px-8 sm:py-8",
                "bg-gradient-to-br via-background to-background ring-1 ring-inset",
                tone.gradient,
                tone.ring,
                "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.98] motion-safe:duration-500",
            )}
        >
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full blur-3xl",
                    tone.glow,
                )}
            />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-background/75 px-3 py-1.5 text-sm font-medium text-foreground-muted ring-1 ring-border/60">
                        <StatusIcon className={cn("h-4 w-4", tone.icon)} />
                        <span>{statusLabel}</span>
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground-muted">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span>{period}</span>
                    </div>
                    <p className={cn(
                        "mt-2 break-words text-4xl font-semibold leading-none tracking-tight tabular-nums sm:text-5xl",
                        tone.amount,
                    )}>
                        {amount}
                    </p>
                </div>

                <div
                    className={cn(
                        "flex shrink-0 items-center border-t pt-4 sm:justify-end sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0",
                        tone.divider,
                    )}
                >
                    <Badge
                        variant={status === "paid" ? "active" : status === "cancelled" ? "cancelled" : "pending"}
                        title={statusLabel}
                    />
                </div>

            </div>
        </section>
    );
}