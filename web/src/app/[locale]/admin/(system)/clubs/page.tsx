import { ClubsAdminPageClient } from "@/domains/club/ClubsAdminPageClient";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({
    params,
}: Props): Promise<Metadata> {
    const { locale } = await params;

    const t = await getTranslations({
        locale,
        namespace: "metadata.clubs",
    });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function AdminClubsPage({
    params,
}: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <ClubsAdminPageClient />;
}
