"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/utils";

import type { NavItem } from "./nav-config";

interface SidebarMainProps {
    items: NavItem[];
    pathname: string;
    onClose: () => void;
    t: (key: string) => string;
}

export const AdminSidebarMain = memo(function SidebarMain({
    items,
    pathname,
    onClose,
    t,
}: SidebarMainProps) {
    return (
        <main className="flex-1 min-h-0 flex flex-col">
            <nav
                role="navigation"
                aria-label="Main navigation"
                className="flex-1 min-h-0 overflow-y-auto py-6 px-3 lg:px-5 space-y-1.5"
            >
                {items.map((item) =>
                    item.children ? (
                        <SidebarGroup
                            key={item.labelKey}
                            item={item}
                            pathname={pathname}
                            onClose={onClose}
                            t={t}
                        />
                    ) : (
                        <SidebarItem
                            key={item.href ?? item.labelKey}
                            item={item}
                            pathname={pathname}
                            onClose={onClose}
                            t={t}
                        />
                    ),
                )}
            </nav>
        </main>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// SidebarItem
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarItemProps {
    item: NavItem;
    pathname: string;
    onClose: () => void;
    t: (key: string) => string;
    depth?: number;
}

const SidebarItem = memo(function SidebarItem({
    item,
    pathname,
    onClose,
    t,
    depth = 0,
}: SidebarItemProps) {
    const Icon = item.icon;

    const isActive = useMemo(() => {
        if (!item.href) return false;

        if (item.href === "/") {
            return pathname === "/";
        }

        return item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
    }, [item.href, item.exact, pathname]);

    return (
        <div className="relative min-w-0">
            {isActive && (
                <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-primary"
                />
            )}

            <Link
                href={(item.href ?? "/") as never}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                    "group flex min-w-0 items-center gap-2.5 rounded-lg text-xs transition-all duration-200 outline-none",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    depth === 0 ? "px-3 py-2" : "px-2.5 py-1.5",
                    isActive
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
                )}
            >
                <Icon
                    className={cn(
                        "h-4 w-4 shrink-0 transition-all duration-200",
                        isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-foreground-muted group-hover:text-foreground dark:group-hover:text-zinc-300",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                />

                <span
                    className="min-w-0 flex-1 text-left leading-4 line-clamp-3 break-words"
                    title={t(item.labelKey)}
                >
                    {t(item.labelKey)}
                </span>
            </Link>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// SidebarGroup
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarGroupProps {
    item: NavItem;
    pathname: string;
    onClose: () => void;
    t: (key: string) => string;
}

const SidebarGroup = memo(function SidebarGroup({
    item,
    pathname,
    onClose,
    t,
}: SidebarGroupProps) {
    const Icon = item.icon;

    const isChildActive = useMemo(
        () =>
            item.children?.some(
                (child) =>
                    child.href &&
                    (pathname === child.href ||
                        pathname.startsWith(`${child.href}/`)),
            ) ?? false,
        [item.children, pathname],
    );

    const [expanded, setExpanded] = useState(isChildActive);

    useEffect(() => {
        if (isChildActive) {
            setExpanded(true);
        }
    }, [isChildActive]);

    const toggle = useCallback(() => {
        setExpanded((value) => !value);
    }, []);

    return (
        <div className="min-w-0">
            <button
                type="button"
                onClick={toggle}
                aria-expanded={expanded}
                aria-label={`${t(item.labelKey)} menu`}
                className={cn(
                    "group flex w-full min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 outline-none",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    isChildActive
                        ? "text-foreground"
                        : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
                )}
            >
                <Icon
                    className={cn(
                        "h-4 w-4 shrink-0 transition-all duration-200",
                        isChildActive
                            ? "text-primary"
                            : "text-foreground-muted group-hover:text-foreground dark:group-hover:text-zinc-300",
                    )}
                    strokeWidth={isChildActive ? 2.5 : 2}
                />

                <span
                    className="min-w-0 flex-1 text-left leading-4 line-clamp-3 break-words"
                    title={t(item.labelKey)}
                >
                    {t(item.labelKey)}
                </span>

                {isChildActive && (
                    <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary dark:bg-blue-400"
                    />
                )}

                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        "h-3.5 w-3.5 shrink-0 text-foreground-muted transition-transform duration-250 ease-out",
                        expanded && "rotate-180",
                    )}
                />
            </button>

            <div
                className={cn(
                    "grid transition-[grid-template-rows] duration-250 ease-out",
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
            >
                <div className="overflow-hidden">
                    <div className="mt-1 ml-[22px] space-y-0.5 border-l border-border py-0.5 pl-3">
                        {item.children?.map((child) => (
                            <SidebarItem
                                key={child.href ?? child.labelKey}
                                item={child}
                                pathname={pathname}
                                onClose={onClose}
                                t={t}
                                depth={1}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});