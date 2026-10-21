"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

import { APP_ENV, APP_VERSION } from "@/lib/config";
import { cn } from "@/utils";

export const AdminSidebarFooter = memo(function SidebarFooter() {
    const t = useTranslations("app") as (key: string) => string;

    const isProduction = APP_ENV === "production";

    return (
        <footer className="px-4 lg:px-6 py-4 border-t border-border shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
                <span className="text-foreground-muted">
                    {t("version")}
                </span>

                <span className="font-medium text-foreground dark:text-zinc-200">
                    v{APP_VERSION}
                </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
                <span className="text-foreground-muted">
                    {t("environment")}
                </span>

                <span
                    className={cn(
                        "rounded-md px-2 py-0.5 font-medium",
                        isProduction
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    )}
                >
                    {isProduction
                        ? t("production")
                        : t("development")}
                </span>
            </div>

            <div className="pt-2 border-t border-border">
                <p className="text-center text-[11px] text-foreground-muted">
                    © {new Date().getFullYear()} {t("fullName")}
                </p>
            </div>
        </footer>
    );
});