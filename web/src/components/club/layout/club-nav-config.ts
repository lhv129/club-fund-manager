import {
    LayoutDashboard,
    Users,
    Mail,
    Wallet,
    Settings,
    LucideIcon,
    UserCheck,
    Banknote
} from "lucide-react";

import {
    MODULE_SLUGS,
    PERMISSION_ACTIONS,
    CLUB_SUBROUTES,
    clubRoute,
} from "@/constants";

// ─── Re-export NavItem + helpers từ admin nav-config ─────────────────────────
// Dùng cùng interface + logic — chỉ khác ở check callback (club-scoped).
export type { NavItem } from "@/components/admin/layout/nav-config";
export { filterNav, findNavTrail } from "@/components/admin/layout/nav-config";

import type { NavItem } from "@/components/admin/layout/nav-config";

// ─── Club nav factory ─────────────────────────────────────────────────────────

/**
 * Build club workspace nav với absolute hrefs dựa trên slug.
 * Gọi từ ClubSidebar sau khi biết slug của club hiện tại.
 *
 * clubRoute(slug, sub) → "/club/{slug}/{sub}"
 * next-intl Link tự thêm locale prefix.
 */
export function CLUB_NAV_ITEMS(slug: string): NavItem[] {
    return [
        // ── Dashboard ─────────────────────────────────────────────────────────
        {
            href: clubRoute(slug, CLUB_SUBROUTES.dashboard),
            labelKey: "dashboard",
            icon: LayoutDashboard,
            module: MODULE_SLUGS.club,
            action: PERMISSION_ACTIONS.view,
            exact: true,
        },

        // ── Thành viên (group) ────────────────────────────────────────────────
        {
            href: clubRoute(slug, CLUB_SUBROUTES.members),
            labelKey: "members",
            icon: Users,
            module: MODULE_SLUGS.clubMember,
            action: PERMISSION_ACTIONS.view,
            children: [
                {
                    href: clubRoute(slug, CLUB_SUBROUTES.members),
                    labelKey: "clubMembers",
                    icon: Users,
                    module: MODULE_SLUGS.clubMember,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(slug, CLUB_SUBROUTES.memberships),
                    labelKey: "memberships",
                    icon: UserCheck,
                    module: MODULE_SLUGS.clubMember,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(slug, CLUB_SUBROUTES.invites),
                    labelKey: "clubInvites",
                    icon: Mail,
                    module: MODULE_SLUGS.clubInvite,
                    action: PERMISSION_ACTIONS.view,
                },
            ],
        },

        // ── Tài chính (group) ─────────────────────────────────────────────────
        {
            labelKey: "funds",
            icon: Wallet,
            module: MODULE_SLUGS.fundPeriods,
            action: PERMISSION_ACTIONS.view,
            children: [
                {
                    href: clubRoute(slug, CLUB_SUBROUTES.fundPeriods),
                    labelKey: "fundPeriods",
                    icon: Wallet,
                    module: MODULE_SLUGS.fundPeriods,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(slug, CLUB_SUBROUTES.monthlyContributions),
                    labelKey: "monthlyContributions",
                    icon: Wallet,
                    module: MODULE_SLUGS.monthlyContributions,
                    action: PERMISSION_ACTIONS.view,
                },
            ],
        },

        // ── Cài đặt ───────────────────────────────────────────────────────────
        {
            href: clubRoute(slug, CLUB_SUBROUTES.settings),
            labelKey: "clubSettings",
            icon: Settings,
            module: MODULE_SLUGS.club,
            action: PERMISSION_ACTIONS.update,
        },
    ];
}
