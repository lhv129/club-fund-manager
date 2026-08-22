"use client";

import {
  Fragment,
  useEffect,
  useState,
} from "react";
import { Popover, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useNotifications } from "@/domains/notification/hooks/useNotifications";
import {
  getNotificationEvent,
} from "@/domains/notification/config/events";
import type { Notification } from "@/domains/notification/types";
import { cn, formatAgo, formatAmount } from "@/utils";
import { APP_ROUTES } from "@/constants";
import {
  CATEGORY_STYLES,
  NOTIFICATION_TYPE_CONFIG,
  type DataField,
  type NotificationData,
  type NotificationTypeConfig,
} from "./notification.config";

const PAGE_SIZE = 10;

/* notification config lives in notification.config.ts */
/*
  club_expense_created: {
    category: "expense",
    translationKey: "events.club_expense_created",
    fields: [
      {
        key: "description",
        labelKey: "dataFields.description",
        type: "text",
      },
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "reference_code",
        labelKey: "dataFields.referenceCode",
        type: "text",
      },
      {
        key: "transaction_date",
        labelKey: "dataFields.transactionDate",
        type: "date",
      },
    ],
  },

  club_transaction_received: {
    category: "income",
    translationKey: "events.club_transaction_received",
    fields: [
      {
        key: "month",
        labelKey: "dataFields.period",
        type: "month",
      },
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "paid_by",
        labelKey: "dataFields.paidBy",
        type: "status",
      },
      {
        key: "member_name",
        labelKey: "dataFields.memberName",
        type: "text",
      },
      {
        key: "confirmed_by",
        labelKey: "dataFields.confirmedBy",
        type: "text",
      },
      {
        key: "reference_code",
        labelKey: "dataFields.referenceCode",
        type: "text",
      },
    ],
  },

  transaction_confirmed: {
    category: "income",
    translationKey: "events.transaction_confirmed",
    fields: [
      {
        key: "month",
        labelKey: "dataFields.period",
        type: "month",
      },
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "paid_by",
        labelKey: "dataFields.paidBy",
        type: "status",
      },
      {
        key: "reference_code",
        labelKey: "dataFields.referenceCode",
        type: "text",
      },
    ],
  },

  fund_due: {
    category: "normal",
    translationKey: "events.fund_due",
    fields: [
      {
        key: "month",
        labelKey: "dataFields.period",
        type: "month",
      },
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "status",
        labelKey: "dataFields.status",
        type: "status",
      },
    ],
  },

  payment_received: {
    category: "income",
    translationKey: "events.payment_received",
    fields: [
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "reference_code",
        labelKey: "dataFields.referenceCode",
        type: "text",
      },
    ],
  },

  contribution_received: {
    category: "income",
    translationKey: "events.contribution_received",
    fields: [
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "month",
        labelKey: "dataFields.period",
        type: "month",
      },
    ],
  },

  contribution_pending: {
    category: "income",
    translationKey: "events.contribution_pending",
    fields: [
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "status",
        labelKey: "dataFields.status",
        type: "status",
      },
    ],
  },

  expense_approved: {
    category: "expense",
    translationKey: "events.expense_approved",
    fields: [
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "description",
        labelKey: "dataFields.description",
        type: "text",
      },
    ],
  },

  expense_rejected: {
    category: "expense",
    translationKey: "events.expense_rejected",
    fields: [
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "description",
        labelKey: "dataFields.description",
        type: "text",
      },
      {
        key: "status",
        labelKey: "dataFields.status",
        type: "status",
      },
    ],
  },

  payment_sent: {
    category: "expense",
    translationKey: "events.payment_sent",
    fields: [
      {
        key: "amount",
        labelKey: "dataFields.amount",
        type: "amount",
      },
      {
        key: "reference_code",
        labelKey: "dataFields.referenceCode",
        type: "text",
      },
    ],
  },

  member_invited: {
    category: "normal",
    translationKey: "events.member_invited",
    fields: [],
  },

  join_request: {
    category: "normal",
    translationKey: "events.join_request",
    fields: [],
  },

  event_reminder: {
    category: "normal",
    translationKey: "events.event_reminder",
    fields: [
      {
        key: "event_date",
        labelKey: "dataFields.eventDate",
        type: "date",
      },
    ],
  },

  system_alert: {
    category: "normal",
    translationKey: "events.system_alert",
    fields: [],
  },
*/

function isRecord(value: unknown): value is NotificationData {
  return typeof value === "object" && value !== null;
}

function getNotificationData(
  notification: Notification,
): NotificationData {
  return isRecord(notification.data)
    ? notification.data
    : {};
}

function getTypeConfig(
  type: string,
): NotificationTypeConfig {
  const configuredType = NOTIFICATION_TYPE_CONFIG[type];

  if (configuredType) {
    return configuredType;
  }

  const event = getNotificationEvent(type);

  return {
    category: event.category,
    translationKey: `events.${type}`,
    fields: [],
  };
}

function humanizeText(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getFallbackFieldLabel(key: string) {
  return humanizeText(key);
}

function getFieldTranslation(
  t: ReturnType<typeof useTranslations>,
  key: string | undefined,
  fallback: string,
) {
  if (!key) {
    return fallback;
  }

  return t.has(key) ? t(key) : fallback;
}

function formatDateValue(
  value: unknown,
  locale: string,
) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMonthValue(
  data: NotificationData,
  locale: string,
) {
  const month = Number(data.month);
  const year = Number(data.year);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatStatusValue(
  value: unknown,
  t: ReturnType<typeof useTranslations>,
) {
  if (typeof value !== "string") {
    return null;
  }

  const statusKey = `statuses.${value}`;

  if (t.has(statusKey)) {
    return t(statusKey);
  }

  const paymentMethodKey = `paymentMethods.${value}`;

  if (t.has(paymentMethodKey)) {
    return t(paymentMethodKey);
  }

  return humanizeText(value);
}

function formatFieldValue(
  field: DataField,
  data: NotificationData,
  locale: string,
  t: ReturnType<typeof useTranslations>,
) {
  if (field.type === "month") {
    return formatMonthValue(data, locale);
  }

  const value = data[field.key];

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (field.type === "amount") {
    return formatAmount(value as string | number, "đ", locale);
  }

  if (field.type === "date") {
    return formatDateValue(value, locale);
  }

  if (field.type === "status") {
    return formatStatusValue(value, t);
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return null;
}

const DATA_FIELD_TRANSLATION_KEYS: Record<string, string> = {
  description: "dataFields.description",
  amount: "dataFields.amount",
  reference_code: "dataFields.referenceCode",
  transaction_date: "dataFields.transactionDate",
  month: "dataFields.period",
  paid_by: "dataFields.paidBy",
  member_name: "dataFields.memberName",
  confirmed_by: "dataFields.confirmedBy",
  status: "dataFields.status",
  event_date: "dataFields.eventDate",
};

function getGenericFields(
  data: NotificationData,
  configuredFields: DataField[],
) {
  const configuredKeys = new Set(
    configuredFields.map((field) => field.key),
  );

  const excludedKeys = new Set([
    "transaction_id",
    "contribution_id",
    "period_id",
    "currency",
    "year",
    "month",
  ]);

  return Object.keys(data)
    .filter(
      (key) =>
        !configuredKeys.has(key) &&
        !excludedKeys.has(key) &&
        data[key] !== null &&
        data[key] !== undefined &&
        data[key] !== "",
    )
    .slice(0, 4)
    .map((key) => ({
      key,
      labelKey: DATA_FIELD_TRANSLATION_KEYS[key],
      type: "text" as const,
    }));
}

/**
 * Hiển thị data của notification theo giao diện trung tính,
 * thống nhất màu sắc và không làm nổi bật riêng từng loại field.
 */
function NotificationDataPreview({
  notification,
}: {
  notification: Notification;
}) {
  const locale = useLocale();
  const t = useTranslations("notification");

  const data = getNotificationData(notification);
  const config = getTypeConfig(notification.type);

  const configuredFields = config.fields;
  const genericFields = getGenericFields(
    data,
    configuredFields,
  );

  const fields = [
    ...configuredFields,
    ...genericFields,
  ];

  const visibleFields = fields
    .map((field) => ({
      field,
      value: formatFieldValue(
        field,
        data,
        locale,
        t,
      ),
    }))
    .filter(
      (
        item,
      ): item is {
        field: DataField;
        value: string;
      } => Boolean(item.value),
    );

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 min-w-0 max-w-full overflow-hidden">
      <div className="divide-y divide-zinc-200/70 dark:divide-gray-700/60">
        {visibleFields.map(({ field, value }) => {
          const label = getFieldTranslation(
            t,
            field.labelKey,
            getFallbackFieldLabel(field.key),
          );

          return (
            <div
              key={field.key}
              className="flex min-w-0 items-start justify-between gap-3 px-3 py-2.5"
            >
              <span className="shrink-0 text-[10px] font-medium text-zinc-500 dark:text-gray-400">
                {label}:
              </span>

              <span
                className="min-w-0 max-w-[72%] break-words text-right text-[11px] font-semibold leading-4 text-zinc-700 dark:text-gray-200"
                title={value}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  const t = useTranslations("notification");
  const config = getTypeConfig(type);
  const categoryStyle = CATEGORY_STYLES[config.category];

  const label = t.has(config.translationKey)
    ? t(config.translationKey as never)
    : t.has(`events.${type}`)
      ? t(`events.${type}` as never)
      : humanizeText(type);

  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        categoryStyle.badge,
        config.badgeClassName,
      )}
      title={label}
    >
      {label}
    </span>
  );
}

function EventIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const event = getNotificationEvent(type);
  const config = getTypeConfig(type);
  const Icon = event.icon;

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        CATEGORY_STYLES[config.category].icon,
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onDelete: (id: number) => void;
}

function NotificationItem({
  notification: item,
  onOpen,
  onDelete,
}: NotificationItemProps) {
  const locale = useLocale();

  return (
    <div
      className={cn(
        "group flex min-w-0 gap-3 px-3 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-gray-800/60 sm:px-4",
        !item.is_read &&
        "bg-blue-50/50 dark:bg-blue-950/20",
      )}
    >
      <EventIcon
        type={item.type}
        className="mt-0.5"
      />

      <button
        type="button"
        onClick={() => onOpen(item)}
        className="min-w-0 flex-1 overflow-hidden text-left focus:outline-none"
      >
        <EventBadge type={item.type} />

        <p className="mt-2 break-words text-sm font-semibold leading-snug text-zinc-900 dark:text-gray-100">
          {item.title}
        </p>

        {item.body && (
          <p className="mt-0.5 line-clamp-3 break-words text-xs leading-relaxed text-zinc-500 dark:text-gray-400">
            {item.body}
          </p>
        )}

        <NotificationDataPreview
          notification={item}
        />

        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="break-words text-[11px] text-zinc-400 dark:text-gray-500">
            {formatAgo(item.created_at, locale)}
          </p>

          {item.club?.name && (
            <>
              <span className="text-zinc-300 dark:text-gray-700">
                •
              </span>

              <span className="min-w-0 max-w-full truncate text-[11px] text-zinc-400 dark:text-gray-500">
                {item.club.name}
              </span>
            </>
          )}
        </div>
      </button>

      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {!item.is_read && (
          <span
            aria-label="unread"
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"
          />
        )}

        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label="delete"
          className="rounded-md p-1.5 text-zinc-300 opacity-0 transition hover:bg-zinc-100 hover:text-red-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function RealtimeBanner({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const t = useTranslations("notification");
  const locale = useLocale();

  return (
    <div className="fixed inset-x-2 top-20 z-[100] w-auto max-w-[340px] overflow-hidden rounded-xl shadow-xl ring-1 ring-black/5 sm:left-auto sm:right-4 sm:inset-x-auto sm:w-[340px] dark:ring-white/10">
      <div className="bg-white dark:bg-gray-900">
        <div className="h-1 bg-blue-500" />

        <div className="flex min-w-0 gap-3 p-3 sm:p-4">
          <EventIcon
            type={notification.type}
            className="mt-0.5"
          />

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <EventBadge type={notification.type} />
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 break-words text-sm font-semibold leading-snug">
              {notification.title}
            </p>

            {notification.body && (
              <p className="mt-1 line-clamp-3 break-words text-xs leading-relaxed text-zinc-500 dark:text-gray-400">
                {notification.body}
              </p>
            )}

            <NotificationDataPreview
              notification={notification}
            />

            <p className="mt-1.5 break-words text-[11px] text-zinc-400">
              {formatAgo(
                notification.created_at,
                locale,
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyNotifications() {
  const t = useTranslations("notification");

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-gray-800">
        <Bell className="h-5 w-5 text-zinc-400" />
      </span>

      <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-gray-300">
        {t("empty.title")}
      </p>

      <p className="mt-1 max-w-xs break-words text-xs text-zinc-500 dark:text-gray-400">
        {t("empty.description")}
      </p>
    </div>
  );
}

function LoadingNotifications() {
  return (
    <div className="space-y-3 p-3 sm:p-4">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex min-w-0 gap-3"
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-100 dark:bg-gray-800" />

          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-3 w-1/3 max-w-24 animate-pulse rounded bg-zinc-100 dark:bg-gray-800" />

            <div className="h-3 w-2/3 max-w-48 animate-pulse rounded bg-zinc-100 dark:bg-gray-800" />

            <div className="h-3 w-1/2 max-w-32 animate-pulse rounded bg-zinc-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationDropdown() {
  const t = useTranslations("notification");
  const locale = useLocale();
  const router = useRouter();

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [banner, setBanner] =
    useState<Notification | null>(null);

  const state = useNotifications(
    locale,
    {
      page: 1,
      limit,
    },
    true,
  );

  useEffect(() => {
    if (state.latestNotification) {
      setBanner(state.latestNotification);
    }
  }, [state.latestNotification]);

  const closeBanner = () => {
    setBanner(null);
    state.clearLatestNotification();
  };

  const handleRead = async (
    item: Notification,
    close: () => void,
  ) => {
    if (!item.is_read) {
      await state.markAsRead(item.id);
    }

    close();
  };

  const handleReadAll = async () => {
    await state.markAllAsRead();
  };

  const handleDelete = async (id: number) => {
    await state.deleteNotification(id);
  };

  const hasMore =
    limit < 50 &&
    state.notifications.length < state.total;

  return (
    <>
      {/* Realtime toast */}
      <Transition
        show={!!banner}
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 translate-x-4"
        enterTo="opacity-100 translate-x-0"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 translate-x-0"
        leaveTo="opacity-0 translate-x-4"
      >
        {banner && (
          <RealtimeBanner
            notification={banner}
            onClose={closeBanner}
          />
        )}
      </Transition>

      {/* Dropdown */}
      <Popover className="relative flex">
        {({ close }) => (
          <>
            <Popover.Button className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-400 dark:hover:bg-gray-800">
              <Bell className="h-5 w-5" />

              {state.unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-none text-white">
                  {state.unreadCount > 99
                    ? "99+"
                    : state.unreadCount}
                </span>
              )}
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="fixed inset-x-2 top-[4.5rem] z-50 w-auto max-w-none sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(24rem,calc(100vw-2rem))] md:w-96">
                <div className="min-w-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                  <div className="min-w-0 bg-white dark:bg-gray-900">
                    {/* Header */}
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-3 py-3 dark:border-gray-800 sm:flex-nowrap sm:px-4">
                      <h3 className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-bold text-zinc-900 dark:text-white">
                        <span className="truncate">
                          {t("title")}
                        </span>

                        {state.unreadCount > 0 && (
                          <span className="shrink-0 text-xs font-medium text-blue-500">
                            {t("unreadCount", {
                              count: state.unreadCount,
                            })}
                          </span>
                        )}
                      </h3>

                      {state.unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => void handleReadAll()}
                          className="inline-flex min-w-0 shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:hover:bg-blue-950/40"
                        >
                          <CheckCheck className="h-3.5 w-3.5 shrink-0" />

                          <span className="truncate">
                            {t("markAllAsRead")}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="table-scroll max-h-[calc(100dvh-9rem)] min-w-0 overflow-x-hidden overflow-y-auto divide-y divide-zinc-50 sm:max-h-[min(32rem,70vh)] dark:divide-gray-800/60">
                      {state.loading ? (
                        <LoadingNotifications />
                      ) : state.notifications.length === 0 ? (
                        <EmptyNotifications />
                      ) : (
                        state.notifications.map((item) => (
                          <NotificationItem
                            key={item.id}
                            notification={item}
                            onOpen={(notification) =>
                              void handleRead(
                                notification,
                                close,
                              )
                            }
                            onDelete={(id) =>
                              void handleDelete(id)
                            }
                          />
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {state.notifications.length > 0 && (
                      <div className="border-t border-zinc-100 p-2 dark:border-gray-800">
                        <div
                          className={cn(
                            "grid gap-1",
                            hasMore
                              ? "grid-cols-1 sm:grid-cols-2"
                              : "grid-cols-1",
                          )}
                        >
                          {hasMore && (
                            <button
                              type="button"
                              onClick={() =>
                                setLimit(
                                  (currentLimit) =>
                                    currentLimit + PAGE_SIZE,
                                )
                              }
                              disabled={state.loading}
                              className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
                            >
                              <Check className="h-3.5 w-3.5 shrink-0" />

                              <span className="truncate">
                                {t("loadMore")}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              close();

                              router.push(
                                `/${locale}${APP_ROUTES.notifications}`,
                              );
                            }}
                            className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />

                            <span className="truncate">
                              {t("viewAll")}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  );
}
