import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ensureProfile } from "@/lib/auth/ensureProfile";
import { NoClubClient } from "@/domains/club/NoClubClient";
import { APP_ROUTES } from "@/constants";

import { LandingShell } from "@/components/shared/layout/LandingShell";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "metadata.joinClub" });
    return { title: t("title"), description: t("description") };
}

export default async function JoinClubPage({ params }: Props) {
    const { locale, slug } = await params;
    setRequestLocale(locale);

    // ensureProfile dùng path hiện tại để redirect-back sau khi refresh token
    const profile = await ensureProfile(locale, `/${locale}/club/${slug}/join-club`);

    // Admin không cần trang này
    if (profile.is_superadmin || profile.is_system_admin) {
        redirect(`/${locale}${APP_ROUTES.admin}`);
    }

    return (
        <LandingShell profile={profile}>
            <NoClubClient />
        </LandingShell>
    );
}