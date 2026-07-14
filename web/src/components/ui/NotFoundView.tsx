import { Link } from "@/i18n/routing";

interface NotFoundViewProps {
    title?: string;
    description?: string;
    href?: string;
    linkLabel?: string;
}

/**
 * Reusable 404 UI — dùng lại ở bất kỳ not-found.tsx nào.
 *
 * @example
 * // not-found.tsx của [locale]
 * <NotFoundView title="404" description={t("notFound")} href="/dashboard" linkLabel={t("backHome")} />
 *
 * @example
 * // not-found.tsx của admin/(system)
 * <NotFoundView title="404" description="Trang không tồn tại." href="/admin" linkLabel="Về Dashboard" />
 */
export default function NotFoundView({
    title = "404",
    description = "Trang không tồn tại.",
    href = "/dashboard",
    linkLabel = "Về trang chủ",
}: NotFoundViewProps) {
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
