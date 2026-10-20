"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils";

interface DetailSectionProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    /** Entrance animation delay in ms (stagger sections) */
    delay?: number;
}

export function DetailSection({
    icon: Icon,
    title,
    description,
    children,
    className,
    delay = 0,
}: DetailSectionProps) {
    return (
        <section
            className={cn(
                "min-w-0",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
                "motion-safe:duration-500 motion-safe:fill-mode-both",
                className,
            )}
            style={delay ? { animationDelay: `${delay}ms` } : undefined}
        >
            <header className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>

                <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-foreground">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
                            {description}
                        </p>
                    )}
                </div>
            </header>

            <div>{children}</div>
        </section>
    );
}
