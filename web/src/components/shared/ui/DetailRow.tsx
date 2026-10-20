"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";
import { CopyAction } from "@/components/shared/ui/button/copy/CopyAction";

interface DetailRowProps {
    label: string;
    value?: ReactNode;
    mono?: boolean;
    prominent?: boolean;
    copyValue?: string | null;
    className?: string;
}

/** Generic label/value row for detail cards and transaction-style summaries. */
export function DetailRow({
    label,
    value,
    mono = false,
    prominent = false,
    copyValue,
    className,
}: DetailRowProps) {
    const isEmpty = value === null || value === undefined || value === "";

    return (
        <div
            className={cn(
                "grid min-h-14 gap-1 py-3 sm:grid-cols-[minmax(8rem,40%)_1fr] sm:items-center sm:gap-5",
                className,
            )}
        >
            <dt className="text-xs font-medium text-foreground-muted sm:text-sm">
                {label}
            </dt>
            <dd className="flex min-w-0 items-center gap-1 sm:justify-end">
                <span
                    className={cn(
                        "min-w-0 break-words text-sm font-medium text-foreground sm:text-right",
                        mono && "font-mono tracking-wide",
                        prominent && "text-base font-semibold tabular-nums",
                        isEmpty && "text-foreground-muted",
                    )}
                >
                    {isEmpty ? "—" : value}
                </span>
                {copyValue && !isEmpty && (
                    <CopyAction value={copyValue} className="shrink-0" />
                )}
            </dd>
        </div>
    );
}