// src/app/[locale]/club/[slug]/memberships/page.tsx

import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MembershipsPageClient } from "@/domains/members/MembershipsPageClient";

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
        namespace: "metadata.memberships",
    });

    return {
        title: t("title"),
        description: t("description"),
    };
}

export default async function ClubMemberShipsPage({
    params,
}: Props) {
    const { locale } = await params;

    setRequestLocale(locale);

    return <MembershipsPageClient />;
}