"use client";
import { browserAdapter } from "@/lib/http/browserAdapter";
import type { ApiResponse } from "@/types/api";
import type { Notification, NotificationListResponse } from "../types";

export const notificationService = {
  list(params?: Record<string, unknown>) { return browserAdapter.get<NotificationListResponse>("/notifications", params); },
  unreadCount() { return browserAdapter.get<ApiResponse<{ count: number }>>("/notifications/unread-count"); },
  markRead(id: number) { return browserAdapter.post<ApiResponse<{ notification: Notification; unread_count: number }>>(`/notifications/${id}/read`); },
  markAllRead() { return browserAdapter.post<ApiResponse<{ unread_count: number; ids?: number[] | null; all?: boolean; read_at?: string }>>("/notifications/read-all", {}); },
  destroy(id: number) { return browserAdapter.delete<ApiResponse<{ id: number; unread_count: number }>>(`/notifications/${id}`); },
};
