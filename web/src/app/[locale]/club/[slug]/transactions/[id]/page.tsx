import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TransactionDetailPageClient } from "@/domains/transaction/TransactionDetailPageClient";

type Props = { params: Promise<{ locale: string; slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: "transaction" });
    return { title: `${t("detailTitle")} #${id}`, description: t("detailDescription") };
}

export default async function TransactionDetailPage({ params }: Props) {
    const { locale, id } = await params;
    setRequestLocale(locale);
    return <TransactionDetailPageClient id={Number(id)} />;
}
