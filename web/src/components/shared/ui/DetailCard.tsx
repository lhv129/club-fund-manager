"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils";

export interface DetailCardProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    delay?: "none" | "short" | "medium";
}

export function DetailCard({
    icon: Icon,
    title,
    description,
    children,
    className,
    delay = "none",
}: DetailCardProps) {
    return (
        <section
            className={cn(
                "overflow-hidden rounded-3xl border border-border/80 bg-background shadow-sm ring-1 ring-foreground/[0.025]",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500",
                delay === "short" && "motion-safe:delay-75",
                delay === "medium" && "motion-safe:delay-150",
                className,
            )}
        >
            <header className="flex items-start gap-3 border-b border-border/80 bg-background-subtle/50 px-4 py-4 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground sm:text-base">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
                            {description}
                        </p>
                    )}
                </div>
            </header>
            <div className="divide-y divide-border px-4 sm:px-5">
                {children}
            </div>
        </section>
    );
}
