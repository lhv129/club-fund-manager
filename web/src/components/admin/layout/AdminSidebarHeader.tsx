"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Crown, Shield, User, X } from "lucide-react";

import { cn } from "@/utils";

export interface SidebarRole {
    id?: number;
    slug?: string;
    name?: string | null;
}

interface AdminSidebarHeaderProps {
    onClose: () => void;
    role: SidebarRole | null;
}

/* ------------------------------------------------------------------ */
/* Role config                                                        */
/* ------------------------------------------------------------------ */

interface RoleVisualConfig {
    icon: typeof Crown;
    badge: string;
    iconColor: string;
}

const ROLE_VISUAL_CONFIG: Record<string, RoleVisualConfig> = {
    superadmin: {
        icon: Crown,
        badge:
            "bg-amber-50/80 dark:bg-amber-500/[0.08] border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-300",
        iconColor: "text-amber-500 dark:text-amber-400",
    },

    admin: {
        icon: Shield,
        badge:
            "bg-blue-50/80 dark:bg-blue-500/[0.08] border-blue-200/60 dark:border-blue-500/20 text-blue-700 dark:text-blue-300",
        iconColor: "text-blue-500 dark:text-blue-400",
    },

    "system-admin": {
        icon: Shield,
        badge:
            "bg-blue-50/80 dark:bg-blue-500/[0.08] border-blue-200/60 dark:border-blue-500/20 text-blue-700 dark:text-blue-300",
        iconColor: "text-blue-500 dark:text-blue-400",
    },

    manager: {
        icon: User,
        badge:
            "bg-violet-50/80 dark:bg-violet-500/[0.08] border-violet-200/60 dark:border-violet-500/20 text-violet-700 dark:text-violet-300",
        iconColor: "text-violet-500 dark:text-violet-400",
    },

    moderator: {
        icon: User,
        badge:
            "bg-cyan-50/80 dark:bg-cyan-500/[0.08] border-cyan-200/60 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-300",
        iconColor: "text-cyan-500 dark:text-cyan-400",
    },

    editor: {
        icon: User,
        badge:
            "bg-emerald-50/80 dark:bg-emerald-500/[0.08] border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
        iconColor: "text-emerald-500 dark:text-emerald-400",
    },

    member: {
        icon: User,
        badge:
            "bg-background-muted/80 border-border text-foreground-muted",
        iconColor: "text-foreground-muted",
    },
};

const DEFAULT_ROLE_VISUAL: RoleVisualConfig = {
    icon: User,
    badge:
        "bg-background-muted/80 border-border text-foreground-muted",
    iconColor: "text-foreground-muted",
};

/* ------------------------------------------------------------------ */
/* Role badge                                                         */
/* ------------------------------------------------------------------ */

function RoleBadge({
    role,
}: {
    role: SidebarRole;
}) {
    const slug = role.slug?.toLowerCase();

    const config: RoleVisualConfig = slug
        ? ROLE_VISUAL_CONFIG[slug] ?? DEFAULT_ROLE_VISUAL
        : DEFAULT_ROLE_VISUAL;

    const RoleIcon = config.icon;
    const label = role.name ?? role.slug ?? "—";

    return (
        <span
            role="status"
            className={cn(
                "inline-flex max-w-full items-center gap-1.5",
                "w-fit shrink-0 rounded-full border px-2 py-1",
                "text-[11px] font-medium leading-3",
                "transition-colors duration-200",
                config.badge,
            )}
            title={label}
        >
            <RoleIcon
                className={cn(
                    "h-3 w-3 shrink-0",
                    config.iconColor,
                )}
                strokeWidth={2}
            />

            <span className="max-w-[140px] truncate">
                {label}
            </span>
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

export const AdminSidebarHeader = memo(
    function AdminSidebarHeader({
        onClose,
        role,
    }: AdminSidebarHeaderProps) {
        const t = useTranslations("app") as (
            key: string,
        ) => string;

        return (
            <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border shrink-0">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {/* App logo */}
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                        <span className="text-primary-foreground font-black text-lg leading-none">
                            C
                        </span>
                    </div>

                    {/* App name + role */}
                    <div className="min-w-0 flex-1">
                        <p
                            className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground"
                            title={t("name")}
                        >
                            {t("name")}
                        </p>

                        {role && (
                            <div className="mt-1 min-w-0">
                                <RoleBadge role={role} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile close */}
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={onClose}
                    className="lg:hidden shrink-0 rounded-lg p-1.5 text-foreground-muted transition-all duration-200 hover:bg-background-muted hover:text-foreground hover:rotate-90"
                >
                    <X className="h-4 w-4" />
                </button>
            </header>
        );
    },
);