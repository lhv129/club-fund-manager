import { getTranslations, setRequestLocale } from "next-intl/server"; import { ExchangeSessionPlayersPageClient } from "@/domains/exchangeSession/ExchangeSessionPlayersPageClient"; import { ClubBreadcrumb } from "@/components/club/layout/ClubBreadcrumb";
export default async function Page({ params }: { params: Promise<{ locale: string; slug: string; sessionId: string }> }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("exchangeSession");
    return <div className="space-y-6">
        <ClubBreadcrumb slug={slug} extraItems={[{ label: t("players") }]} />
        <ExchangeSessionPlayersPageClient />
    </div>
}
