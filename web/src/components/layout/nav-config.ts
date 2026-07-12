import {
    Building2,
    FolderOpen,
    LayoutDashboard,
    Mail,
    CirclePlus,
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

export const NAV_ITEMS: NavItem[] = [
    {
        href: APP_ROUTES.dashboard,
        labelKey: "dashboard",
        icon: LayoutDashboard,
    },
    {
        href: APP_ROUTES.clubs,
        labelKey: "clubs",
        icon: Building2,
        module: MODULE_SLUGS.club,
        action: PERMISSION_ACTIONS.view,
    },
    {
        href: APP_ROUTES.clubMembers,
        labelKey: "clubMembers",
        icon: Users,
        module: MODULE_SLUGS.club,
        action: PERMISSION_ACTIONS.view,
    },
    {
        href: APP_ROUTES.clubInvites,
        labelKey: "clubInvites",
        icon: Mail,
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
                href: APP_ROUTES.users,
                labelKey: "usersList",
                icon: Users,
                module: MODULE_SLUGS.user,
                action: PERMISSION_ACTIONS.view,
            },
            {
                href: APP_ROUTES.roles,
                labelKey: "roles",
                icon: ShieldCheck,
                module: MODULE_SLUGS.role,
                action: PERMISSION_ACTIONS.view,
            },
            {
                href: APP_ROUTES.permissions,
                labelKey: "permissions",
                icon: KeyRound,
                module: MODULE_SLUGS.permission,
                action: PERMISSION_ACTIONS.view,
            },
        ],
    },
    {
        href: APP_ROUTES.settings,
        labelKey: "settings",
        icon: Settings,
    },
];

// ─── helpers (không đổi) ────────────────────────────────────────────────────

/** Recursively filter items the user has permission to see. */
export function filterNav(
    items: NavItem[],
    check: (module?: string, action?: string) => boolean,
    isSuperAdmin: boolean
): NavItem[] {
    return items
        .map((item) => {
            const children = item.children
                ? filterNav(item.children, check, isSuperAdmin)
                : undefined;

            const allowed =
                isSuperAdmin ||
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