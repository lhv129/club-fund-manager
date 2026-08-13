// src/app/[locale]/club/[slug]/monthly-contributions/page.tsx

import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MonthlyContributionsPageClient } from "@/domains/monthlyContribution/MonthlyContributionsPageClient";

type Props = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

export async function generateMetadata({
    params,
}: Props): Promise<Metadata> {
    const { locale } = await params;

    const t = await getTranslations({
        locale,
        namespace: "metadata.monthlyContributions",
    });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function MonthlyContributionsPage({
    params,
}: Props) {
    const { locale } = await params;

    setRequestLocale(locale);

    return <MonthlyContributionsPageClient />;
}