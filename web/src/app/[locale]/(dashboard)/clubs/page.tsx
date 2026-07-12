import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ClubsPageClient } from "@/domains/club/ClubsPageClient";

export default async function ClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("menu");
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <ClubsPageClient />
    </div>
  );
}
