import { setRequestLocale } from "next-intl/server";
import { ClubsAdminPageClient } from "@/domains/club/ClubsAdminPageClient";

export default async function AdminClubsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <ClubsAdminPageClient />;
}
