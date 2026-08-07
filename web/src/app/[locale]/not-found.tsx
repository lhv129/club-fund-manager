// app/[locale]/club/[slug]/not-found.tsx
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import NotFoundView from "@/components/shared/ui/NotFoundView";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <NotFoundView
      title="404"
      heading={t("title")}
      description={t("description")}
      href="/"
      linkLabel={t("backHome")}
      renderLink={({ href, className, children }) => (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    />
  );
}