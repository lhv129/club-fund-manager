import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeCheck,
  Banknote,
  CalendarPlus,
  CircleAlert,
  Pencil,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Event map — khai báo tập trung mọi notification `type` của backend.
 * Khớp 1-1 với key dịch `notification.events.*` trong messages/vi|en.json
 * và contract ở api/docs/notifications/notification-overview.md §9.
 *
 * Khi backend thêm type mới: thêm 1 entry ở đây + 2 key dịch (vi/en).
 * Type lạ (chưa khai báo) → fallback `normal` với icon mặc định.
 */

export type NotificationCategory = "income" | "expense" | "normal";

export interface NotificationEventConfig {
  /** Icon hiển thị ở avatar item + toast banner. */
  icon: LucideIcon;
  /** Phân loại màu sắc — khớp `notification.category.*` trong messages. */
  category: NotificationCategory;
}

export const NOTIFICATION_EVENTS: Record<string, NotificationEventConfig> = {
  // ── Thu quỹ ──
  fund_due: { icon: Wallet, category: "income" },
  monthly_contribution_created: { icon: CalendarPlus, category: "income" },
  monthly_contribution_updated: { icon: Pencil, category: "normal" },
  monthly_contribution_cancelled: { icon: CircleAlert, category: "normal" },
  monthly_contribution_deleted: { icon: Trash2, category: "normal" },
  transaction_confirmed: { icon: BadgeCheck, category: "income" },
  cash_payment_confirmed: { icon: Banknote, category: "income" },
  club_transaction_received: { icon: ArrowDownCircle, category: "income" },

  // ── Chi ──
  club_expense_created: { icon: ArrowUpCircle, category: "expense" },
};

const FALLBACK_EVENT: NotificationEventConfig = {
  icon: CircleAlert,
  category: "normal",
};

export function getNotificationEvent(type: string): NotificationEventConfig {
  return NOTIFICATION_EVENTS[type] ?? FALLBACK_EVENT;
}
