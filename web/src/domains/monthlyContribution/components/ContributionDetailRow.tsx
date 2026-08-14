"use client";

import { cn } from "@/utils";

export function ContributionDetailRow({ label, value, mono = false, prominent = false }: { label: string; value: React.ReactNode; mono?: boolean; prominent?: boolean }) {
    return (
        <div className="grid min-h-14 gap-1 py-3 sm:grid-cols-[minmax(8rem,40%)_1fr] sm:items-center sm:gap-5">
            <dt className="text-xs font-medium text-foreground-muted sm:text-sm">{label}</dt>
            <dd className={cn("min-w-0 break-words text-sm font-medium text-foreground sm:text-right", mono && "font-mono tracking-wide", prominent && "text-base font-semibold tabular-nums")}>{value || "—"}</dd>
        </div>
    );
}
