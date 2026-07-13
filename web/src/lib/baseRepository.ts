import type { HttpAdapter } from "@/lib/http/types";
import type {
    ApiResponse,
    CursorResponse,
    PaginatedResponse,
    CursorListParams,
    ListParams,
} from "@/types/api";

/**
 * BaseRepository — abstract class duy nhất cho mọi domain service.
 *
 * Toàn bộ method chỉ viết 1 lần tại đây.
 * Server service inject serverAdapter, client service inject browserAdapter.
 *
 * @example Server service:
 *   import { serverAdapter } from "@/lib/http/serverAdapter";
 *   class ExampleService extends BaseRepository<Example> {
 *     resource = "examples";
 *     adapter = serverAdapter;
 *   }
 *
 * @example Client service:
 *   import { browserAdapter } from "@/lib/http/browserAdapter";
 *   class ExampleServiceClient extends BaseRepository<Example> {
 *     resource = "examples";
 *     adapter = browserAdapter;
 *   }
 */
export abstract class BaseRepository<T> {
    protected abstract resource: string;
    protected abstract adapter: HttpAdapter;

    // ─── Low-level HTTP (dùng khi cần path tùy chỉnh) ───────────────────────────

    protected get<R>(path: string, params?: Record<string, unknown>): Promise<R> {
        return this.adapter.get<R>(path, params);
    }

    protected post<R>(path: string, body?: unknown): Promise<R> {
        return this.adapter.post<R>(path, body);
    }

    protected put<R>(path: string, body?: unknown): Promise<R> {
        return this.adapter.put<R>(path, body);
    }

    protected patch<R>(path: string, body?: unknown): Promise<R> {
        return this.adapter.patch<R>(path, body);
    }

    protected delete<R>(path: string): Promise<R> {
        return this.adapter.delete<R>(path);
    }

    // ─── CRUD & common operations ────────────────────────────────────────────────

    list(params?: ListParams): Promise<PaginatedResponse<T>> {
        return this.get<PaginatedResponse<T>>(`/${this.resource}`, params);
    }

    cursorList(params?: CursorListParams): Promise<CursorResponse<T>> {
        return this.get<CursorResponse<T>>(`/${this.resource}/cursor`, params);
    }

    select(params?: Partial<ListParams>): Promise<ApiResponse<T[]>> {
        return this.get<ApiResponse<T[]>>(`/${this.resource}/select`, params);
    }

    show(id: number | string): Promise<ApiResponse<T>> {
        return this.get<ApiResponse<T>>(`/${this.resource}/${id}`);
    }

    showBySlug(slug: string): Promise<ApiResponse<T>> {
        return this.get<ApiResponse<T>>(`/${this.resource}/slug/${slug}`);
    }

    create(data: Partial<T> | Record<string, unknown> | FormData): Promise<ApiResponse<T>> {
        return this.post<ApiResponse<T>>(`/${this.resource}`, data);
    }

    update(
        id: number | string,
        data: Partial<T> | Record<string, unknown> | FormData
    ): Promise<ApiResponse<T>> {
        return this.put<ApiResponse<T>>(`/${this.resource}/${id}`, data);
    }

    destroy(id: number | string): Promise<ApiResponse<null>> {
        return this.delete<ApiResponse<null>>(`/${this.resource}/${id}`);
    }

    toggleStatus(id: number | string): Promise<ApiResponse<T>> {
        return this.post<ApiResponse<T>>(`/${this.resource}/${id}/toggle-status`);
    }
}
