import {
    LayoutDashboard,
    Users,
    Mail,
    Wallet,
    Settings,
    UserCheck,
    Banknote,
    CalendarDays,
    CalendarClock,
    Landmark,
    ScanLine,
    Webhook,
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
 *
 * Gọi từ ClubSidebar sau khi biết slug của club hiện tại.
 *
 * clubRoute(slug, sub) → "/club/{slug}/{sub}"
 * next-intl Link tự thêm locale prefix.
 */
export function CLUB_NAV_ITEMS(slug: string): NavItem[] {
    return [
        // ── Dashboard ────────────────────────────────────────────────────────
        {
            href: clubRoute(slug, CLUB_SUBROUTES.dashboard),
            labelKey: "dashboard",
            icon: LayoutDashboard,
            module: MODULE_SLUGS.club,
            action: PERMISSION_ACTIONS.view,
            exact: true,
        },

        // ── Lịch chơi ─────────────────────────────────────────────────────────
        {
            labelKey: "playingSchedulesMenu",
            icon: CalendarDays,
            module: MODULE_SLUGS.playingSchedule,
            action: PERMISSION_ACTIONS.view,
            children: [
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.playingSchedules
                    ),
                    labelKey: "playingSchedules",
                    icon: CalendarDays,
                    module: MODULE_SLUGS.playingSchedule,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.exchangeSessions
                    ),
                    labelKey: "exchangeSessions",
                    icon: CalendarClock,
                    module: MODULE_SLUGS.exchangeSession,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.exchangeSessionPlayerPayments
                    ),
                    labelKey: "exchangeSessionPlayerPayments",
                    icon: CalendarClock,
                    module: MODULE_SLUGS.exchangeSessionPlayer,
                    action: PERMISSION_ACTIONS.view,
                },
            ],
        },

        // ── Thành viên ────────────────────────────────────────────────────────
        {
            labelKey: "members",
            icon: Users,
            module: MODULE_SLUGS.clubMember,
            action: PERMISSION_ACTIONS.view,
            children: [
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.members
                    ),
                    labelKey: "clubMembers",
                    icon: Users,
                    module: MODULE_SLUGS.clubMember,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.memberships
                    ),
                    labelKey: "memberships",
                    icon: UserCheck,
                    module: MODULE_SLUGS.clubMember,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.invites
                    ),
                    labelKey: "clubInvites",
                    icon: Mail,
                    module: MODULE_SLUGS.clubInvite,
                    action: PERMISSION_ACTIONS.view,
                },
            ],
        },

        // ── Tài chính ─────────────────────────────────────────────────────────
        {
            labelKey: "funds",
            icon: Wallet,
            module: MODULE_SLUGS.fundPeriod,
            action: PERMISSION_ACTIONS.view,
            children: [
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.fundPeriods
                    ),
                    labelKey: "fundPeriods",
                    icon: Wallet,
                    module: MODULE_SLUGS.fundPeriod,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.monthlyContributions
                    ),
                    labelKey: "monthlyContributions",
                    icon: Banknote,
                    module: MODULE_SLUGS.monthlyContribution,
                    action: PERMISSION_ACTIONS.view,
                },
                {
                    href: clubRoute(
                        slug,
                        CLUB_SUBROUTES.transactions
                    ),
                    labelKey: "transactions",
                    icon: Banknote,
                    module: MODULE_SLUGS.transaction,
                    action: PERMISSION_ACTIONS.view,
                },
            ],
        },

        // ── Tài khoản ngân hàng ───────────────────────────────────────────────
        {
            href: clubRoute(
                slug,
                CLUB_SUBROUTES.bankAccounts
            ),
            labelKey: "bankAccounts",
            icon: Landmark,
            module: MODULE_SLUGS.bankAccount,
            action: PERMISSION_ACTIONS.view,
        },

        // ── Cấu hình webhook ────────────────────────────────────────────────
        {
            href: clubRoute(
                slug,
                CLUB_SUBROUTES.webhookConfigs
            ),
            labelKey: "webhookConfigs",
            icon: Webhook,
            module: MODULE_SLUGS.webhookConfig,
            action: PERMISSION_ACTIONS.view,
        },

        // ── Mã thanh toán ─────────────────────────────────────────────────────
        {
            href: clubRoute(
                slug,
                CLUB_SUBROUTES.paymentCodes
            ),
            labelKey: "paymentCodes",
            icon: ScanLine,
            module: MODULE_SLUGS.memberPaymentCode,
            action: PERMISSION_ACTIONS.view,
        },

        // ── Cài đặt ───────────────────────────────────────────────────────────
        {
            href: clubRoute(
                slug,
                CLUB_SUBROUTES.settings
            ),
            labelKey: "clubSettings",
            icon: Settings,
            module: MODULE_SLUGS.club,
            action: PERMISSION_ACTIONS.update,
        },
    ];
}
