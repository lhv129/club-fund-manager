"use client";

import { cn } from "@/utils";

export type FundPeriodView = "active" | "trashed";

interface FundPeriodTabsProps {
    value: FundPeriodView;
    activeLabel: string;
    trashedLabel: string;
    onChange: (value: FundPeriodView) => void;
}

export function FundPeriodTabs({
    value,
    activeLabel,
    trashedLabel,
    onChange,
}: FundPeriodTabsProps) {
    const tabs = [
        {
            value: "active" as const,
            label: activeLabel,
        },
        {
            value: "trashed" as const,
            label: trashedLabel,
        },
    ];

    return (
        <div className="flex w-full gap-6 border-b border-border" role="tablist">
            {tabs.map((tab) => {
                const selected = value === tab.value;

                return (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onChange(tab.value)}
                        className={cn(
                            "relative min-h-11 whitespace-nowrap px-0.5 pb-3 pt-2 text-sm font-medium transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            selected
                                ? "text-primary"
                                : "text-foreground-muted hover:text-foreground",
                        )}
                    >
                        {tab.label}
                        {selected && (
                            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
