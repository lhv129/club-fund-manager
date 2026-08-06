// src/app/[locale]/club/[slug]/monthly-contributions/page.tsx
import { setRequestLocale } from "next-intl/server";
import { MonthlyContributionsPageClient } from "@/domains/monthlyContribution/MonthlyContributionsPageClient";

export default async function MonthlyContributionsPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <MonthlyContributionsPageClient />;
}
