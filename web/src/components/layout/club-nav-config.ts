import {
    LayoutDashboard,
    Users,
    Mail,
    Wallet,
    CalendarDays,
    Settings,
    LucideIcon,
} from "lucide-react";

import { MODULE_SLUGS, PERMISSION_ACTIONS, CLUB_SUBROUTES } from "@/constants";

/**
 * Nav item cho Club workspace.
 *
 * Khác với admin nav (href tuyệt đối), club nav dùng `sub` —
 * sub-route key trong CLUB_SUBROUTES. ClubSidebar sẽ ghép với
 * slug của CLB hiện tại thành: `/club/{slug}/{sub}`.
 *
 * `module` + `action` dùng cho permission check theo clubId:
 *   hasPermission(module, action, club.id)
 */
export interface ClubNavItem {
    /** Sub-route key (từ CLUB_SUBROUTES) — ghép với slug để tạo href. */
    sub: string;
    labelKey: string;
    module: string;
    action: string;
    icon: LucideIcon;
}

/**
 * Club workspace nav.
 *
 * Module slugs dạng "club_member", "club_invite", ... — TODO: xác nhận với BE
 * cho khớp với modules.slug. Nếu BE dùng slug khác, Sidebar tự ẩn item khi
 * user thiếu quyền nên không break.
 */
export const CLUB_NAV_ITEMS: ClubNavItem[] = [
    {
        sub: CLUB_SUBROUTES.dashboard,
        labelKey: "dashboard",
        module: MODULE_SLUGS.club,
        action: PERMISSION_ACTIONS.view,
        icon: LayoutDashboard,
    },
    {
        sub: CLUB_SUBROUTES.members,
        labelKey: "members",
        module: MODULE_SLUGS.club,
        action: PERMISSION_ACTIONS.view,
        icon: Users,
    },
    {
        sub: CLUB_SUBROUTES.invites,
        labelKey: "invites",
        module: MODULE_SLUGS.club,
        action: PERMISSION_ACTIONS.view,
        icon: Mail,
    },
    // ── Placeholder — chờ BE triển khai ─────────────────────────────────────
    // {
    //     sub: CLUB_SUBROUTES.funds,
    //     labelKey: "funds",
    //     module: "club_fund",
    //     action: PERMISSION_ACTIONS.view,
    //     icon: Wallet,
    // },
    // {
    //     sub: CLUB_SUBROUTES.events,
    //     labelKey: "events",
    //     module: "club_event",
    //     action: PERMISSION_ACTIONS.view,
    //     icon: CalendarDays,
    // },
    {
        sub: CLUB_SUBROUTES.settings,
        labelKey: "clubSettings",
        module: MODULE_SLUGS.club,
        action: PERMISSION_ACTIONS.update,
        icon: Settings,
    },
];
