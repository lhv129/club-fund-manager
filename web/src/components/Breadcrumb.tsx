"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, ChevronRight } from "lucide-react";
import { DASHBOARD_NAV_ITEMS, findNavTrail } from "./layout/nav-config";

export function Breadcrumb() {
    const t = useTranslations("menu") as (key: string) => string;
    const pathname = usePathname() as string;
    const trail = findNavTrail(DASHBOARD_NAV_ITEMS, pathname) ?? [];

    return (
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm">
            {/* Home */}
            <Link
                href={"/"}
                className="flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>

            {trail.map((item, index) => {
                const isLast = index === trail.length - 1;

                return (
                    <span key={item.href ?? item.labelKey} className="flex items-center">
                        <ChevronRight className="mx-1 w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />

                        {isLast ? (
                            <span className="font-medium text-gray-900 dark:text-white">
                                {t(item.labelKey)}
                            </span>
                        ) : (
                            <Link
                                href={(item.href ?? "/") as never}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
