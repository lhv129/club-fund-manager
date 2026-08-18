import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClubBreadcrumb } from "@/components/club/layout/ClubBreadcrumb";
import { ExchangeSessionPlayerPaymentsPageClient } from "@/domains/exchangeSession/ExchangeSessionPlayerPaymentsPageClient";

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("exchangeSession");
    return <div className="space-y-6"><ClubBreadcrumb slug={slug} extraItems={[{ label: t("playerPaymentTracking") }]} /><ExchangeSessionPlayerPaymentsPageClient /></div>;
}
