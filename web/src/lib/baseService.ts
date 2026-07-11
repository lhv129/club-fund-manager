import "server-only";
import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  CursorResponse,
  PaginatedResponse,
  CursorListParams,
  ListParams,
} from "@/types/api";

/**
 * BaseService — base for all domain services.
 *
 * Provides generic HTTP methods (get/post/put/delete) + standard CRUD
 * for a fixed `resource`. Domain services extend this and add custom
 * methods using this.get/post/put/delete with any path.
 *
 * ⚠️ Server-only — do NOT import from Client Components.
 */
export abstract class BaseService<T> {
  /** Resource path segment — override in subclass (e.g. 'users'). */
  protected abstract resource: string;

  // -------------------------------------------------------------------------
  // Generic HTTP methods — use any path
  // -------------------------------------------------------------------------

  get<R>(path: string, params?: Record<string, unknown>): Promise<R> {
    return apiClient.get<R>(path, params);
  }

  getWithMeta<R>(path: string, params?: Record<string, unknown>): Promise<R> {
    return apiClient.get<R>(path, params);
  }

  post<R>(path: string, body?: unknown): Promise<R> {
    return apiClient.post<R>(path, body);
  }

  put<R>(path: string, body?: unknown): Promise<R> {
    return apiClient.put<R>(path, body);
  }

  patch<R>(path: string, body?: unknown): Promise<R> {
    return apiClient.patch<R>(path, body);
  }

  delete<R>(path: string): Promise<R> {
    return apiClient.delete<R>(path);
  }

  // -------------------------------------------------------------------------
  // Standard CRUD — auto-prefixed with /{resource}
  // -------------------------------------------------------------------------

  /** GET /{resource} — paginated list. */
  list(params?: ListParams): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(`/${this.resource}`, params);
  }

  /** GET /{resource}/cursor — cursor pagination. */
  cursorList(params?: CursorListParams): Promise<CursorResponse<T>> {
    return this.get<CursorResponse<T>>(`/${this.resource}/cursor`, params);
  }

  /** GET /{resource}/select — dropdown list. */
  select(params?: Partial<ListParams>): Promise<ApiResponse<T[]>> {
    return this.get<ApiResponse<T[]>>(`/${this.resource}/select`, params);
  }

  /** GET /{resource}/{id} — single record. */
  show(id: number | string): Promise<ApiResponse<T>> {
    return this.get<ApiResponse<T>>(`/${this.resource}/${id}`);
  }

  /** GET /{resource}/slug/{slug} — find by slug. */
  showBySlug(slug: string): Promise<ApiResponse<T>> {
    return this.get<ApiResponse<T>>(`/${this.resource}/slug/${slug}`);
  }

  /** POST /{resource} — create. */
  create(data: Partial<T> | Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.post<ApiResponse<T>>(`/${this.resource}`, data);
  }

  /** PUT /{resource}/{id} — update. */
  update(
    id: number | string,
    data: Partial<T> | Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    return this.put<ApiResponse<T>>(`/${this.resource}/${id}`, data);
  }

  /** DELETE /{resource}/{id} — delete. */
  destroy(id: number | string): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/${this.resource}/${id}`);
  }

  /** POST /{resource}/{id}/toggle-status — toggle is_active/status. */
  toggleStatus(id: number | string): Promise<ApiResponse<T>> {
    return this.post<ApiResponse<T>>(`/${this.resource}/${id}/toggle-status`);
  }
}
