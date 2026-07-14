import {
    Building2,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    KeyRound,
    Users,
    LucideIcon,
} from "lucide-react";

import { APP_ROUTES, MODULE_SLUGS, PERMISSION_ACTIONS } from "@/constants";

export interface NavItem {
    href?: string;
    labelKey: string;
    module?: string;
    action?: string;
    icon: LucideIcon;
    children?: NavItem[];
}

/**
 * Dashboard workspace nav — system pages dưới /dashboard/...
 * (clubs, users, roles, permissions, settings).
 *
 * Club-scoped pages (members, invites, funds, ...) KHÔNG nằm đây —
 * chúng thuộc club workspace (xem club-nav-config.ts).
 */
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
    {
        href: APP_ROUTES.dashboard,
        labelKey: "dashboard",
        icon: LayoutDashboard,
    },
    {
        href: APP_ROUTES.dashboardClubs,
        labelKey: "clubs",
        icon: Building2,
        module: MODULE_SLUGS.club,
        action: PERMISSION_ACTIONS.view,
    },
    {
        labelKey: "users",
        icon: ShieldCheck,
        module: MODULE_SLUGS.user,
        action: PERMISSION_ACTIONS.view,
        children: [
            {
                href: APP_ROUTES.dashboardUsers,
                labelKey: "usersList",
                icon: Users,
                module: MODULE_SLUGS.user,
                action: PERMISSION_ACTIONS.view,
            },
            {
                href: APP_ROUTES.dashboardRoles,
                labelKey: "roles",
                icon: ShieldCheck,
                module: MODULE_SLUGS.role,
                action: PERMISSION_ACTIONS.view,
            },
            {
                href: APP_ROUTES.dashboardPermissions,
                labelKey: "permissions",
                icon: KeyRound,
                module: MODULE_SLUGS.permission,
                action: PERMISSION_ACTIONS.view,
            },
        ],
    },
    {
        href: APP_ROUTES.dashboardSettings,
        labelKey: "settings",
        icon: Settings,
    },
];

// ─── helpers (không đổi) ────────────────────────────────────────────────────

/** Recursively filter items the user has permission to see. */
export function filterNav(
    items: NavItem[],
    check: (module?: string, action?: string) => boolean,
    showAll: boolean
): NavItem[] {
    return items
        .map((item) => {
            const children = item.children
                ? filterNav(item.children, check, showAll)
                : undefined;

            const allowed =
                showAll ||
                !item.module ||
                !item.action ||
                check(item.module, item.action);

            if (allowed || (children && children.length > 0)) {
                return {
                    ...item,
                    children: children?.length ? children : undefined,
                };
            }

            return null;
        })
        .filter(Boolean) as NavItem[];
}

/** Recursively find the nav trail (breadcrumb) for a given pathname. */
export function findNavTrail(
    items: NavItem[],
    pathname: string,
    parents: NavItem[] = []
): NavItem[] | null {
    for (const item of items) {
        const trail = item.href ? [...parents, item] : parents;

        if (item.href && item.href !== "/" && pathname.startsWith(item.href)) {
            return trail;
        }

        if (item.children) {
            const found = findNavTrail(item.children, pathname, trail);
            if (found) return found;
        }
    }

    return null;
}