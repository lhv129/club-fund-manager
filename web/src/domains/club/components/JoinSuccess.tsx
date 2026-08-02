// src/components/shared/ui/JoinSuccess.tsx
"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Building2, Trophy } from "lucide-react";
import { Button } from "@/components/shared/ui/Button";

interface JoinSuccessProps {
    clubName: string;
    message: string;
    onDismiss: () => void;
}

export function JoinSuccess({ clubName, message, onDismiss }: JoinSuccessProps) {
    const t = useTranslations("noClub");

    return (
        <div className="relative flex flex-col items-center justify-center py-14 px-6 text-center overflow-hidden">
            {/* Decorative background glow */}
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
                <div className="mt-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl animate-in fade-in duration-700" />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
                <div
                    className="mt-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl animate-in fade-in duration-700"
                    style={{ animationDelay: "120ms" }}
                />
            </div>

            {/* Confetti dots */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[
                    { left: "18%", top: "22%", delay: "0ms", color: "bg-emerald-400" },
                    { left: "78%", top: "28%", delay: "80ms", color: "bg-amber-400" },
                    { left: "30%", top: "62%", delay: "160ms", color: "bg-sky-400" },
                    { left: "70%", top: "66%", delay: "240ms", color: "bg-emerald-400" },
                    { left: "50%", iconTop: "16%", delay: "320ms", color: "bg-amber-300" },
                    { left: "12%", top: "48%", delay: "400ms", color: "bg-sky-300" },
                    { left: "86%", top: "52%", delay: "480ms", color: "bg-emerald-300" },
                ].map((d, i) => (
                    <span
                        key={i}
                        className={`absolute ${d.color} rounded-full animate-in fade-in zoom-in-50 duration-500`}
                        style={{
                            left: d.left,
                            top: (d as any).top ?? (d as any).iconTop,
                            width: 6,
                            height: 6,
                            animationDelay: d.delay,
                            animationFillMode: "both",
                        }}
                    />
                ))}
            </div>

            {/* Content layer */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
                {/* Icon with layered rings */}
                <div className="relative mb-7">
                    <span
                        className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"
                        style={{ animationIterationCount: 2, animationDuration: "1100ms" }}
                    />
                    <span className="absolute -inset-3 rounded-full bg-emerald-500/10 blur-md animate-in fade-in duration-500" />

                    <div
                        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/15 to-emerald-500/5
                         ring-1 ring-emerald-500/25 flex items-center justify-center
                         animate-in zoom-in-50 duration-500"
                    >
                        <span className="absolute inset-0 rounded-full ring-1 ring-emerald-500/10 animate-pulse" />
                        <CheckCircle2
                            className="w-10 h-10 text-emerald-500 animate-in zoom-in-75 duration-500"
                            strokeWidth={1.75}
                            style={{ animationDelay: "120ms", animationFillMode: "both" }}
                        />
                    </div>
                </div>

                {/* Text block */}
                <div
                    className="space-y-2.5 animate-in fade-in slide-in-from-bottom-3 duration-500"
                    style={{ animationDelay: "200ms", animationFillMode: "both" }}
                >
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        <Trophy className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {t("joinSuccessBadge")}
                        </span>
                    </div>

                    <h2 className="text-xl font-semibold text-foreground">
                        {t("joinSuccessTitle")}
                    </h2>
                    <p className="text-sm text-foreground-muted max-w-xs leading-relaxed mx-auto">
                        {message}
                    </p>
                </div>

                {/* Club badge */}
                <div
                    className="mt-5 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl
                       bg-background-subtle border border-border shadow-sm
                       animate-in fade-in slide-in-from-bottom-3 duration-500"
                    style={{ animationDelay: "320ms", animationFillMode: "both" }}
                >
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 shrink-0">
                        <Building2 className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {clubName}
                    </span>
                    <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                </div>

                {/* Hint + action */}
                <div
                    className="mt-7 flex flex-col items-center gap-3 w-full max-w-xs
                       animate-in fade-in slide-in-from-bottom-3 duration-500"
                    style={{ animationDelay: "440ms", animationFillMode: "both" }}
                >
                    <p className="text-xs text-foreground-muted">{t("joinSuccessHint")}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDismiss}
                        className="w-full hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:text-emerald-600 transition-colors"
                    >
                        {t("joinSuccessDismiss")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
