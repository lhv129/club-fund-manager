/**
 * Global API types — mirror backend BaseController response envelope.
 *
 * Backend responses:
 *   responseCommon()  → { success, message, data }
 *   paginateResponse() → { success, message, data, meta: { page, limit, total, last_page } }
 *   cursorResponse()   → { success, message, data, meta: { limit, has_more, next_cursor, prev_cursor } }
 */

/** Standard success response. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Offset pagination meta (from paginateResponse). */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  last_page: number;
}

/** Cursor pagination meta (from cursorResponse). */
export interface CursorMeta {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
  prev_cursor: string | null;
}

/** Offset paginated response. */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/** Cursor paginated response. */
export interface CursorResponse<T> extends ApiResponse<T[]> {
  meta: CursorMeta;
}

/** Error response from ApiException. */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  data: unknown;
}

/** Validation error response (HTTP 422). */
export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[]>;
}

/** Query params cho list/paginate endpoints. */
export interface ListParams {
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  limit?: number;
  page?: number;
  [key: string]: unknown;
}

/** Query params cho cursor pagination. */
export interface CursorListParams extends Omit<ListParams, "page"> {
  cursor?: string;
}
