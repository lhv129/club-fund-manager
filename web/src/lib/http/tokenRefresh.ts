import "server-only";
import { API_URL } from "@/lib/config";
import { FALLBACK_LOCALE } from "@/lib/locales";

/**
 * Refresh token flow DÙNG CHUNG bởi mọi đường refresh trong app:
 *  - serverAdapter (auto-refresh-on-401 trong /api/proxy)
 *  - /api/auth/refresh route handler (SSR recovery + JSON mode)
 *
 * Laravel rotate refresh_token sau mỗi lần refresh (single-use). Trước đây
 * 2 đường refresh độc lập có thể cùng dùng một refresh_token: request đến
 * Laravel sau cùng bị 401 (token đã rotate) → clear cookie một cách oan,
 * biến session đang tốt thành lỗi "thi thoảng 404/lost session".
 *
 * Cơ chế chống race:
 *  1. Single-flight: Map dedupe theo refresh_token — nhiều caller cùng lúc
 *     chỉ tạo 1 request tới Laravel, tất cả nhận cùng kết quả.
 *  2. Grace period: token vừa rotate thành công trong ROTATED_GRACE_MS thì
 *     request chậm hơn (vẫn giữ token cũ do cookie chưa kịp cập nhật,
 *     vd: Link prefetch) nhận lại kết quả mới thay vì 401 — tương đương
 *     "refresh token grace period" phía backend nhưng implement ở frontend.
 */

export type RefreshResult =
    | { ok: true; access_token: string; refresh_token: string; message?: string }
    | { ok: false; status: number; message?: string };

const REFRESH_TIMEOUT_MS = 15_000;
const ROTATED_GRACE_MS = 30_000;

const inFlightRefreshByToken = new Map<string, Promise<RefreshResult>>();
const recentlyRotated = new Map<
    string,
    { result: Extract<RefreshResult, { ok: true }>; expires: number }
>();

function pruneRecentlyRotated() {
    const now = Date.now();
    for (const [token, entry] of recentlyRotated) {
        if (entry.expires <= now) recentlyRotated.delete(token);
    }
}

/**
 * Gọi Laravel /auth/refresh bằng refresh_token cho trước.
 * KHÔNG đụng cookie — caller tự persist (cookieStore.set hoặc Set-Cookie
 * trên NextResponse) theo ngữ cảnh của mình.
 */
export async function refreshWithToken(
    refreshToken: string,
    locale: string = FALLBACK_LOCALE,
): Promise<RefreshResult> {
    // Token vừa được rotate ở một request khác → trả kết quả đã có,
    // không đánh thức Laravel bằng token đã tiêu.
    const rotated = recentlyRotated.get(refreshToken);
    if (rotated && rotated.expires > Date.now()) {
        return rotated.result;
    }

    const inFlight = inFlightRefreshByToken.get(refreshToken);
    if (inFlight) {
        return inFlight;
    }

    const refreshPromise = (async (): Promise<RefreshResult> => {
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Accept-Language": locale,
                    locale,
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
                cache: "no-store",
                // Timeout để promise không bao giờ kẹt vĩnh viễn trong Map.
                signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
            });

            const json = await res.json().catch(() => null);
            if (
                !res.ok ||
                !json?.success ||
                !json?.data?.access_token ||
                !json?.data?.refresh_token
            ) {
                return {
                    ok: false,
                    status: res.status,
                    message: json?.message ?? "Refresh failed",
                };
            }

            const result = {
                ok: true as const,
                access_token: json.data.access_token as string,
                refresh_token: json.data.refresh_token as string,
                message: json.message,
            };
            recentlyRotated.set(refreshToken, {
                result,
                expires: Date.now() + ROTATED_GRACE_MS,
            });
            pruneRecentlyRotated();
            return result;
        } catch {
            return { ok: false, status: 500, message: "Refresh request failed" };
        } finally {
            inFlightRefreshByToken.delete(refreshToken);
        }
    })();

    inFlightRefreshByToken.set(refreshToken, refreshPromise);
    return refreshPromise;
}
