"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, ChevronRight } from "lucide-react";
import { NavItem, findNavTrail } from "@/components/admin/layout/nav-config";
import { ADMIN_NAV_ITEMS } from "@/components/admin/layout/nav-config";
import { APP_ROUTES } from "@/constants";

// Segment động (không cần labelKey)
export interface BreadcrumbSegment {
    label: string;   // text hiển thị trực tiếp
    href?: string;
}

interface BreadcrumbProps {
    navItems?: NavItem[];
    homeHref?: string;
    /** Các segment động thêm vào SAU trail từ nav config */
    extraItems?: BreadcrumbSegment[];
}

export function Breadcrumb({
    navItems = ADMIN_NAV_ITEMS,
    homeHref = APP_ROUTES.home,
    extraItems = [],
}: BreadcrumbProps) {
    const t = useTranslations("menu") as (key: string) => string;
    const pathname = usePathname() as string;
    const trail = findNavTrail(navItems, pathname) ?? [];

    // Gộp trail tĩnh + segment động
    type AnyItem = { label?: string; labelKey?: string; href?: string; isDynamic?: boolean };
    const allItems: AnyItem[] = [
        ...trail.map((item) => ({ labelKey: item.labelKey, href: item.href })),
        ...extraItems.map((seg) => ({ label: seg.label, href: seg.href, isDynamic: true })),
    ];

    return (
        <nav
            aria-label="breadcrumb"
            className="flex items-center text-xs text-foreground-muted"
        >
            <Link
                href={homeHref as never}
                aria-label="Home"
                className="flex items-center transition-colors duration-150 hover:text-foreground"
            >
                <Home className="w-3.5 h-3.5" />
            </Link>

            {allItems.map((item, index) => {
                const isLast = index === allItems.length - 1;
                const isClickable = !!item.href && !isLast;
                const text = item.isDynamic ? item.label! : t(item.labelKey!);

                return (
                    <span key={item.href ?? item.labelKey ?? index} className="flex items-center">
                        <ChevronRight
                            className="mx-1.5 w-3 h-3 text-border shrink-0"
                            strokeWidth={2.5}
                        />
                        {isLast ? (
                            <span className="font-semibold text-foreground">
                                {text}
                            </span>
                        ) : isClickable ? (
                            <Link
                                href={(item.href ?? "/") as never}
                                className="transition-all duration-150 hover:font-semibold hover:text-foreground"
                            >
                                {text}
                            </Link>
                        ) : (
                            <span className="text-foreground-muted">{text}</span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
