import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import NotFoundView from "@/components/shared/ui/NotFoundView";

export default async function NotFound() {
    const locale = await getLocale();
    const t = await getTranslations("notFound");
    const homeHref = `/${locale}`;

    return (
        <NotFoundView
            title="404"
            heading={t("title")}
            description={t("description")}
            href={homeHref}
            linkLabel={t("backHome")}
            renderLink={({ href, className, children }) => (
                <Link href={href} className={className}>
                    {children}
                </Link>
            )}
        />
    );
}
