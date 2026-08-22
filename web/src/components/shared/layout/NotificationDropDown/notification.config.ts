import type { NotificationCategory } from "@/domains/notification/config/events";

export type NotificationData = Record<string, unknown>;
export type DataField = {
  key: string;
  labelKey?: string;
  type?: "text" | "amount" | "date" | "month" | "status";
};
export type NotificationTypeConfig = {
  category: NotificationCategory;
  translationKey: string;
  fields: DataField[];
  badgeClassName?: string;
};

export const CATEGORY_STYLES: Record<NotificationCategory, { icon: string; badge: string }> = {
  income: { icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300", badge: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" },
  expense: { icon: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300", badge: "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300" },
  normal: { icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300", badge: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300" },
};

export const NOTIFICATION_TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  club_expense_created: { category: "expense", translationKey: "events.club_expense_created", fields: [{ key: "description", labelKey: "dataFields.description", type: "text" }, { key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "reference_code", labelKey: "dataFields.referenceCode", type: "text" }, { key: "transaction_date", labelKey: "dataFields.transactionDate", type: "date" }] },
  club_transaction_received: { category: "income", translationKey: "events.club_transaction_received", fields: [{ key: "month", labelKey: "dataFields.period", type: "month" }, { key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "paid_by", labelKey: "dataFields.paidBy", type: "status" }, { key: "member_name", labelKey: "dataFields.memberName", type: "text" }, { key: "confirmed_by", labelKey: "dataFields.confirmedBy", type: "text" }, { key: "reference_code", labelKey: "dataFields.referenceCode", type: "text" }] },
  transaction_confirmed: { category: "income", translationKey: "events.transaction_confirmed", fields: [{ key: "month", labelKey: "dataFields.period", type: "month" }, { key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "paid_by", labelKey: "dataFields.paidBy", type: "status" }, { key: "reference_code", labelKey: "dataFields.referenceCode", type: "text" }] },
  fund_due: { category: "normal", translationKey: "events.fund_due", fields: [{ key: "month", labelKey: "dataFields.period", type: "month" }, { key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "status", labelKey: "dataFields.status", type: "status" }] },
  payment_received: { category: "income", translationKey: "events.payment_received", fields: [{ key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "reference_code", labelKey: "dataFields.referenceCode", type: "text" }] },
  contribution_received: { category: "income", translationKey: "events.contribution_received", fields: [{ key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "month", labelKey: "dataFields.period", type: "month" }] },
  contribution_pending: { category: "income", translationKey: "events.contribution_pending", fields: [{ key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "status", labelKey: "dataFields.status", type: "status" }] },
  expense_approved: { category: "expense", translationKey: "events.expense_approved", fields: [{ key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "description", labelKey: "dataFields.description", type: "text" }] },
  expense_rejected: { category: "expense", translationKey: "events.expense_rejected", fields: [{ key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "description", labelKey: "dataFields.description", type: "text" }, { key: "status", labelKey: "dataFields.status", type: "status" }] },
  payment_sent: { category: "expense", translationKey: "events.payment_sent", fields: [{ key: "amount", labelKey: "dataFields.amount", type: "amount" }, { key: "reference_code", labelKey: "dataFields.referenceCode", type: "text" }] },
  member_invited: { category: "normal", translationKey: "events.member_invited", fields: [] }, join_request: { category: "normal", translationKey: "events.join_request", fields: [] },
  event_reminder: { category: "normal", translationKey: "events.event_reminder", fields: [{ key: "event_date", labelKey: "dataFields.eventDate", type: "date" }] },
  system_alert: { category: "normal", translationKey: "events.system_alert", fields: [] },
};
