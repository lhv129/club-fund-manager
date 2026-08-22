"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";
import { useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead } from "./useNotificationActions";
import type { Notification } from "../types";

export function useNotifications(locale: string, params: { page: number; limit: number }, enabled = true) {
  const client = useQueryClient();
  // The API localizes title/body from Accept-Language. Keeping locale in the
  // key prevents Vietnamese and English responses from sharing one cache.
  const key = ["notifications", locale, params] as const;
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const query = useQuery({ queryKey: key, queryFn: () => notificationService.list(params), enabled });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();
  useEffect(() => { const handler = (event: Event) => { const n = (event as CustomEvent<Notification>).detail; if (n?.id) { setLatestNotification(n); client.invalidateQueries({ queryKey: ["notifications"] }); } }; window.addEventListener("notification:new", handler); return () => window.removeEventListener("notification:new", handler); }, [client]);
  return { notifications: query.data?.data ?? [], total: query.data?.meta?.total ?? 0, unreadCount: query.data?.meta?.unread_count ?? 0, loading: query.isLoading, latestNotification, clearLatestNotification: () => setLatestNotification(null), markAsRead: (id: number) => markRead.mutateAsync(id), markAllAsRead: () => markAllRead.mutateAsync(), deleteNotification: (id: number) => remove.mutateAsync(id) };
}
