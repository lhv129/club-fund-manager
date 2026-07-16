/**
 * HttpAdapter interface — contract chung cho serverAdapter và browserAdapter.
 * BaseRepository chỉ phụ thuộc vào interface này, không phụ thuộc vào implementation.
 */
export interface HttpAdapter {
    get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
    post<T>(path: string, body?: unknown): Promise<T>;
    put<T>(path: string, body?: unknown): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string, params?: Record<string, unknown>): Promise<T>;
    toggleStatus<T>(path: string): Promise<T>;
}
