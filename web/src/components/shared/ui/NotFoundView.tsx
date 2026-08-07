import Link from "next/link";
import type { ReactNode } from "react";

export interface NotFoundLinkProps {
    href: string;
    className: string;
    children: ReactNode;
}

export interface NotFoundViewProps {
    title?: string;
    heading?: string;
    description?: string;
    href?: string;
    linkLabel?: string;

    /**
     * Cho phép root not-found dùng next/link
     * và locale not-found dùng Link từ @/i18n/routing.
     */
    renderLink?: (props: NotFoundLinkProps) => ReactNode;
}

export default function NotFoundView({
    title = "404",
    heading = "Trang bạn tìm không tồn tại",
    description = "Trang bạn đang tìm kiếm có thể đã bị xóa, thay đổi hoặc không tồn tại.",
    href = "/",
    linkLabel = "Về trang chủ",
    renderLink,
}: NotFoundViewProps) {
    const linkClassName =
        "inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background";

    const defaultLink = (
        <Link href={href} className={linkClassName}>
            {linkLabel}
        </Link>
    );

    const homeLink =
        renderLink?.({
            href,
            className: linkClassName,
            children: linkLabel,
        }) ?? defaultLink;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-background-muted blur-3xl"
            />

            <section
                aria-labelledby="not-found-title"
                className="relative z-10 w-full max-w-xl text-center"
            >
                <p
                    aria-hidden="true"
                    className="select-none text-[clamp(7rem,22vw,11rem)] font-bold leading-none tracking-[-0.1em] text-primary/20"
                >
                    {title}
                </p>

                <h1
                    id="not-found-title"
                    className="mt-8 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                >
                    {heading}
                </h1>

                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-foreground-muted sm:text-base">
                    {description}
                </p>

                <div className="mt-8">{homeLink}</div>
            </section>
        </main>
    );
}