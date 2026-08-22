import type { PaginatedResponse } from "@/types/api";

export interface NotificationClub {
  id: number;
  name: string;
}

export interface Notification {
  id: number;
  club?: NotificationClub | null;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationMeta {
  page: number;
  limit: number;
  total: number;
  last_page: number;
  unread_count: number;
}

export interface NotificationListResponse extends Omit<PaginatedResponse<Notification>, "meta"> {
  meta: NotificationMeta;
}

export type NotificationFilters = { page?: number; limit?: number };
