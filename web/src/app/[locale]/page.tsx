import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { ensureProfile } from "@/lib/auth/ensureProfile";
import { LandingShell } from "@/components/shared/layout/LandingShell";
import { ClubsPageClient } from "@/domains/club/ClubsPageClient";
import { NoClubClient } from "@/domains/club/NoClubClient";
import type { Club, Translation } from "@/domains/club/types";
import { APP_ROUTES, clubDashboardRoute } from "@/constants";
import { canAccessClub, hasAnySystemPermission } from "@/lib/permissions";

function pickSlugByLocale(club: Club, locale: string): string | undefined {
  return (
    club.translations?.find((tr: Translation) => tr.locale === locale)?.slug ??
    club.translations?.[0]?.slug
  );
}

/**
 * Root landing — /{locale}/
 *
 * 1. Chưa login                → /{locale}/login
 * 2. superadmin / system admin → /{locale}/admin
 * 3. 1 club truy cập được      → /{locale}/club/{slug}/dashboard
 * 4. 2+ clubs                  → render <ClubsPageClient />
 * 5. 0 club                    → render <NoClubClient />
 */
export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await ensureProfile(locale, `/${locale}`);

  if (profile.is_superadmin || profile.is_system_admin) {
    redirect(`/${locale}${APP_ROUTES.admin}`);
  }

  const LIMIT = 10;
  let clubs: Club[] = [];
  let total = 0;

  try {
    const res = await clubServiceServer.list({ limit: LIMIT });
    const listedClubs = res.data ?? [];
    const isSystemAdmin =
      profile.is_system_admin ||
      hasAnySystemPermission(profile.permissions, profile.is_superadmin);

    clubs = listedClubs.filter((club) =>
      canAccessClub(
        profile.permissions,
        profile.is_superadmin,
        club.id,
        isSystemAdmin,
      ),
    );
    total = clubs.length;
  } catch {
    clubs = [];
    total = 0;
  }

  if (clubs.length === 1) {
    const slug = pickSlugByLocale(clubs[0], locale);
    if (slug) {
      redirect(`/${locale}${clubDashboardRoute(slug)}`);
    }
  }

  if (clubs.length >= 2) {
    return (
      <LandingShell profile={profile}>
        <ClubsPageClient clubs={clubs} total={total} />
      </LandingShell>
    );
  }

  return (
    <LandingShell profile={profile}>
      <NoClubClient />
    </LandingShell>
  );
}
