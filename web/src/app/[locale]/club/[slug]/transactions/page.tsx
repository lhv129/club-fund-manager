import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TransactionsPageClient } from "@/domains/transaction/TransactionsPageClient";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "metadata.transactions" });
    return { title: t("title"), description: t("description") };
}

export default async function TransactionsPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <TransactionsPageClient />;
}
