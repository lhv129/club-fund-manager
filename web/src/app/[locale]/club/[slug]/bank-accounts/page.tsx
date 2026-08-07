import { setRequestLocale } from "next-intl/server";

import { BankAccountsPageClient } from "@/domains/bankAccount/BankAccountsPageClient";

export default async function BankAccountsPage({
    params,
}: {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
}) {
    const { locale } = await params;

    setRequestLocale(locale);

    return <BankAccountsPageClient />;
}