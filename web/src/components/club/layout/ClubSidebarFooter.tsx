"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

import { APP_VERSION } from "@/lib/config";

export const ClubSidebarFooter = memo(
    function ClubSidebarFooter() {
        const t = useTranslations("app") as (
            key: string,
        ) => string;

        return (
            <footer className="px-4 lg:px-6 py-4 border-t border-border shrink-0 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground-muted">
                        {t("version")}
                    </span>

                    <span className="font-medium text-foreground">
                        v{APP_VERSION}
                    </span>
                </div>

                <div className="pt-1.5 border-t border-border">
                    <p className="text-center text-[11px] text-foreground-muted">
                        © {new Date().getFullYear()} {t("fullName")}
                    </p>
                </div>
            </footer>
        );
    },
);