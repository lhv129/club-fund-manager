/**
 * Shared query string builder — dùng chung cho cả server và browser adapter.
 */
export function buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return "";
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        qs.append(key, String(value));
    }
    const s = qs.toString();
    return s ? `?${s}` : "";
}
