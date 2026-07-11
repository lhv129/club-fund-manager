"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { APP_ROUTES, MODULE_SLUGS, PERMISSION_ACTIONS } from "@/constants";
import { cn } from "@/utils";

interface NavItem {
  href: string;
  labelKey: string;
  module?: string;
  action?: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: APP_ROUTES.dashboard, labelKey: "dashboard", icon: "📊" },
  { href: APP_ROUTES.clubs, labelKey: "clubs", module: MODULE_SLUGS.club, action: PERMISSION_ACTIONS.view, icon: "🏛️" },
  { href: APP_ROUTES.clubMembers, labelKey: "clubMembers", module: MODULE_SLUGS.club, action: PERMISSION_ACTIONS.view, icon: "👥" },
  { href: APP_ROUTES.clubInvites, labelKey: "clubInvites", module: MODULE_SLUGS.club, action: PERMISSION_ACTIONS.view, icon: "✉️" },
  { href: APP_ROUTES.users, labelKey: "users", module: MODULE_SLUGS.user, action: PERMISSION_ACTIONS.view, icon: "👤" },
  { href: APP_ROUTES.roles, labelKey: "roles", module: MODULE_SLUGS.role, action: PERMISSION_ACTIONS.view, icon: "🔑" },
  { href: APP_ROUTES.permissions, labelKey: "permissions", module: MODULE_SLUGS.permission, action: PERMISSION_ACTIONS.view, icon: "🛡️" },
  { href: APP_ROUTES.settings, labelKey: "settings", icon: "⚙️" },
];

export function Sidebar() {
  const t = useTranslations("menu");
  const pathname = usePathname() as string;
  const { hasPermission, isSuperAdmin } = useAuth();

  const isVisible = (item: NavItem): boolean => {
    if (!item.module || !item.action) return true;
    return isSuperAdmin || hasPermission(item.module, item.action);
  };

  return (
    <aside className="flex h-full w-60 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <span className="text-lg font-bold text-zinc-900">
          Club Fund
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.filter(isVisible).map((item) => {
          const href: string = item.href;
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <span className="text-base">{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
