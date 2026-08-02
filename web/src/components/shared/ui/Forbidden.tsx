// src/components/shared/ui/Forbidden.tsx
import { Link } from "@/i18n/routing";

interface ForbiddenProps {
    title?: string;
    description?: string;
    href?: string;
    linkLabel?: string;
}

/**
 * Reusable 403 UI — dùng lại ở bất kỳ page nào thiếu quyền.
 *
 * @example
 * // Page guard trong Client Component
 * if (!canView) return <Forbidden />;
 *
 * @example
 * // Tùy chỉnh nội dung
 * <Forbidden description="Bạn không có quyền quản lý thành viên." href="/club/abc/dashboard" linkLabel="Về Dashboard" />
 */
export function Forbidden({
    title = "403",
    description = "Bạn không có quyền truy cập trang này.",
    href = "/",
    linkLabel = "Về trang chủ",
}: ForbiddenProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-8xl font-bold text-zinc-200">{title}</h1>
            <p className="text-lg text-zinc-500">{description}</p>
            <Link
                href={href}
                className="mt-2 rounded-lg bg-color2 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
                {linkLabel}
            </Link>
        </div>
    );
}