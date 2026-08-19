import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClubBreadcrumb } from "@/components/club/layout/ClubBreadcrumb";
import { ExchangeSessionPlayerPaymentsPageClient } from "@/domains/exchangeSession/ExchangeSessionPlayerPaymentsPageClient";

type Props = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const t = await getTranslations({
        locale,
        namespace: "metadata.exchangeSessionPlayerPayments",
    });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function Page({ params }: Props) {
    const { locale, slug } = await params;

    setRequestLocale(locale);

    const t = await getTranslations("exchangeSession");

    return (
        <div className="space-y-6">
            <ClubBreadcrumb
                slug={slug}
                extraItems={[{ label: t("playerPaymentTracking") }]}
            />

            <ExchangeSessionPlayerPaymentsPageClient />
        </div>
    );
}