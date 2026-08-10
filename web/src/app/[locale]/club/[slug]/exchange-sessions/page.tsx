import { setRequestLocale } from "next-intl/server";
import { ExchangeSessionsPageClient } from "@/domains/exchangeSession/ExchangeSessionsPageClient";
import { ClubBreadcrumb } from "@/components/club/layout/ClubBreadcrumb";
export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params; setRequestLocale(locale);
    return <div className="space-y-6">
        <ClubBreadcrumb slug={slug} />
        <ExchangeSessionsPageClient />
    </div>
}
