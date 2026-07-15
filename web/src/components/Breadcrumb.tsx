"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, ChevronRight } from "lucide-react";
import { ADMIN_NAV_ITEMS, findNavTrail } from "./layout/nav-config";

export function Breadcrumb() {
    const t = useTranslations("menu") as (key: string) => string;
    const pathname = usePathname() as string;
    const trail = findNavTrail(ADMIN_NAV_ITEMS, pathname) ?? [];

    return (
        <nav
            aria-label="breadcrumb"
            className="flex items-center gap-0 text-xs font-semibold uppercase tracking-wider"
        >
            {/* Home */}
            <Link
                href={"/"}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
                <Home className="w-3.5 h-3.5" />
                <span>Trang chủ</span>
            </Link>

            {trail.map((item, index) => {
                const isLast = index === trail.length - 1;

                return (
                    <span key={item.href ?? item.labelKey} className="flex items-center">
                        <ChevronRight
                            className="mx-2 w-3.5 h-3.5 text-zinc-300 dark:text-gray-600"
                            strokeWidth={2.5}
                        />
                        {isLast ? (
                            <span className="text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                {t(item.labelKey)}
                            </span>
                        ) : (
                            <Link
                                href={(item.href ?? "/") as never}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {t(item.labelKey)}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}