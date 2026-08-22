"use client";

import { useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useNotifications } from "./hooks/useNotifications";
import { formatAgo } from "@/utils";

const PAGE_SIZE = 15;

export function NotificationsPageClient() {
  const locale = useLocale();
  const t = useTranslations("notification");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const state = useNotifications(locale, { page: 1, limit });

  return <div className="mx-auto w-full max-w-4xl">
    <div className="mb-5 flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1><p className="mt-1 text-sm text-zinc-500">{t("count", { count: state.total })}</p></div>{state.unreadCount > 0 && <button onClick={() => void state.markAllAsRead()} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"><CheckCheck className="h-4 w-4" />{t("markAllAsRead")}</button>}</div>
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {!state.loading && state.notifications.length === 0 ? <div className="flex flex-col items-center py-16 text-zinc-500"><Bell className="mb-3 h-8 w-8" /><p>{t("empty.title")}</p></div> : state.notifications.map((item) => <article key={item.id} className={`border-b border-zinc-100 p-4 last:border-0 dark:border-gray-800 ${!item.is_read ? "bg-blue-50/40 dark:bg-blue-950/10" : ""}`}><div className="flex gap-4"><button className="min-w-0 flex-1 text-left" onClick={() => !item.is_read && void state.markAsRead(item.id)}><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-zinc-900 dark:text-white">{item.title}</h2><time className="shrink-0 text-xs text-zinc-400">{formatAgo(item.created_at, locale)}</time></div>{item.body && <p className="mt-1 text-sm text-zinc-500 dark:text-gray-400">{item.body}</p>}</button><button onClick={() => void state.deleteNotification(item.id)} aria-label="delete" className="h-8 rounded-md p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div></article>)}
    </div>
    {state.notifications.length < state.total && <button onClick={() => setLimit((value) => value + PAGE_SIZE)} className="mt-4 w-full rounded-md border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-white dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900">{t("loadMore")}</button>}
  </div>;
}
