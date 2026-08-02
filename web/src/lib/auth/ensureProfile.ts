import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_NAMES, APP_ROUTES } from "@/constants";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import type { Profile } from "@/domains/auth/types";

/**
 * SSR session guard — dùng trong Server Component (page/layout).
 *
 * Vấn đề: Server Component không set cookie được (Next.js 16), nên không thể
 * tự rotate access_token khi hết hạn. Nếu gọi serverAdapter refresh-on-401
 * ngay trong SSR thì refresh_token bị rotate ở backend nhưng cookie không
 * persist → refresh sau cũng fail.
 *
 * Giải pháp (ensureProfile):
 *  1. Nếu access_token còn → gọi /auth/profile trực tiếp.
 *  2. Nếu access_token hết (401) hoặc thiếu → redirect browser qua
 *     Route Handler `/api/auth/refresh?next=<currentPath>` để rotate cookie
 *     rồi quay lại trang hiện tại. Lúc đó SSR chạy lại với access_token mới.
 *  3. Nếu refresh thất bại (refresh_token invalid) → Route Handler tự redirect
 *     về login, Server Component không cần xử lý.
 *
 * Trả về profile hoặc throw redirect (không bao giờ return null).
 */
export async function ensureProfile(locale: string, currentPath: string): Promise<Profile> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.accessToken)?.value;

    // Có access_token → thử fetch profile trực tiếp.
    if (accessToken) {
        try {
            const res = await authServiceServer.getProfile();
            if (res.data) return res.data;
        } catch {
            // Profile fail (có thể 401 do token vừa hết) → rơi xuống recover.
        }
    }

    // Access token thiếu/hết → nhờ Route Handler rotate cookie rồi quay lại.
    // Server Component không gọi fetch('/api/auth/refresh') được vì fetch
    // trong SSR không tự gửi cookie của browser.
    const refreshUrl = `/api/auth/refresh?next=${encodeURIComponent(currentPath)}`;
    redirect(refreshUrl);
}

/**
 * Đường dẫn protected hiện tại (có locale prefix) dùng làm `next` khi recover.
 * Ghép từ locale + pathname đã có locale prefix.
 */
export function protectedCurrentPath(locale: string, pathname: string): string {
    // pathname đã có locale prefix (vd /vi/admin/users) — dùng luôn.
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
        return pathname;
    }
    // Fallback: ghép locale prefix.
    return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/**
 * Helper redirect login dùng sau khi ensureProfile không thể recover
 * (thực tế ensureProfile đã tự redirect login qua Route Handler khi refresh
 * thất bại, nên helper này chỉ dùng cho các guard khác muốn redirect login).
 */
export function redirectToLogin(locale: string, from?: string): never {
    const loginUrl = `/${locale}${APP_ROUTES.login}`;
    const target = from
        ? `${loginUrl}?redirect=${encodeURIComponent(from)}`
        : loginUrl;
    redirect(target);
}
