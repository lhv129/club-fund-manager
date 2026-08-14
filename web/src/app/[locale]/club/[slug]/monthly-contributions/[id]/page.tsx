import { setRequestLocale } from "next-intl/server";
import { MonthlyContributionDetailPageClient } from "@/domains/monthlyContribution/MonthlyContributionDetailPageClient";

export default async function MonthlyContributionDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    setRequestLocale(locale);
    return <MonthlyContributionDetailPageClient id={Number(id)} />;
}
