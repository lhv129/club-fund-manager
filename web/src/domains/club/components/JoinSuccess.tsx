"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Building2 } from "lucide-react";
import { Button } from "@/components/shared/ui/Button";

interface JoinSuccessProps {
    clubName: string;
    message: string;
    onDismiss: () => void;
}

export function JoinSuccess({ clubName, message, onDismiss }: JoinSuccessProps) {
    const t = useTranslations("noClub");

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {/* Icon */}
            <div className="relative mb-6">
                {/* Pulse ring — chạy 1 lần rồi dừng */}
                <span
                    className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping"
                    style={{ animationIterationCount: 2, animationDuration: "900ms" }}
                />
                <div
                    className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20
                     flex items-center justify-center
                     animate-in zoom-in-75 duration-300"
                >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" strokeWidth={1.75} />
                </div>
            </div>

            {/* Text block */}
            <div
                className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: "80ms", animationFillMode: "both" }}
            >
                <h2 className="text-lg font-semibold text-foreground">
                    {t("joinSuccessTitle")}
                </h2>
                <p className="text-sm text-foreground-muted max-w-xs leading-relaxed">
                    {message}
                </p>
            </div>

            {/* Club badge */}
            <div
                className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-background-subtle border border-border
                   animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: "160ms", animationFillMode: "both" }}
            >
                <Building2 className="w-4 h-4 text-foreground-muted shrink-0" />
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {clubName}
                </span>
                <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>

            {/* Hint + action */}
            <div
                className="mt-6 flex flex-col items-center gap-3 w-full max-w-xs
                   animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: "240ms", animationFillMode: "both" }}
            >
                <p className="text-xs text-foreground-muted">{t("joinSuccessHint")}</p>
                <Button variant="outline" size="sm" onClick={onDismiss} className="w-full">
                    {t("joinSuccessDismiss")}
                </Button>
            </div>
        </div>
    );
}