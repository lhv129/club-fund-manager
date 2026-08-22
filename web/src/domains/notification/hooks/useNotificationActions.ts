"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";

export function useNotificationUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.unreadCount(),
    enabled,
    select: (response) => response.data?.count ?? 0,
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: (response) => {
      client.setQueriesData({ queryKey: ["notifications"] }, (old: any) => {
        if (!Array.isArray(old?.data)) return old;
        return {
          ...old,
          data: old.data.map((item: any) =>
            item.id === response.data?.notification?.id
              ? response.data.notification
              : item,
          ),
          meta: { ...old.meta, unread_count: response.data?.unread_count ?? old.meta.unread_count },
        };
      });
      client.setQueryData(["notifications", "unread-count"], { success: true, data: { count: response.data?.unread_count ?? 0 } });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: (response) => {
      const unreadCount = response.data?.unread_count ?? 0;
      client.setQueriesData({ queryKey: ["notifications"] }, (old: any) => Array.isArray(old?.data)
        ? { ...old, data: old.data.map((item: any) => ({ ...item, is_read: true, read_at: item.read_at ?? response.data?.read_at ?? new Date().toISOString() })), meta: { ...old.meta, unread_count: unreadCount } }
        : old);
      client.setQueryData(["notifications", "unread-count"], { success: true, data: { count: unreadCount } });
    },
  });
}

export function useDeleteNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationService.destroy(id),
    onSuccess: (response, id) => {
      client.setQueriesData({ queryKey: ["notifications"] }, (old: any) => Array.isArray(old?.data)
        ? { ...old, data: old.data.filter((item: any) => item.id !== id), meta: { ...old.meta, total: Math.max(0, old.meta.total - 1), unread_count: response.data?.unread_count ?? old.meta.unread_count } }
        : old);
      if (response.data?.unread_count !== undefined) client.setQueryData(["notifications", "unread-count"], { success: true, data: { count: response.data.unread_count } });
    },
  });
}
