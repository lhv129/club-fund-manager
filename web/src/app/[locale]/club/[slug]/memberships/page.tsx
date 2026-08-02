// src/app/[locale]/club/[slug]/history-member/page.tsx
import { setRequestLocale } from "next-intl/server";
import { MembershipsPageClient } from "@/domains/members/MembershipsPageClient";

export default async function ClubHistoryMembersPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <MembershipsPageClient />;
}
