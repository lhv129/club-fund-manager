import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { canAccessClub } from "@/lib/permissions";
import { LandingShell } from "@/components/layout/LandingShell";
import { ClubsPageClient } from "@/domains/club/ClubsPageClient";
import { NoClubClient } from "@/domains/club/NoClubClient";
import type { Profile } from "@/domains/auth/types";
import type { Club, Translation } from "@/domains/club/types";

/** Lấy slug theo locale hiện tại từ club.translations. */
function pickSlugByLocale(club: Club, locale: string): string | undefined {
  return (
    club.translations?.find((tr: Translation) => tr.locale === locale)?.slug ??
    club.translations?.[0]?.slug
  );
}

/**
 * Root landing — /{locale}/
 *
 * Server Component phân luồng theo role:
 *  1. Chưa login                → /{locale}/login
 *  2. superadmin / system admin → /{locale}/admin
 *  3. 1 club truy cập được      → /{locale}/club/{slug}/dashboard
 *  4. 2+ clubs                  → render <ClubsPageClient clubs={...} />
 *  5. 0 club                    → render <NoClubClient /> (KHÔNG redirect)
 */
export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 1. Auth check
  const token = await getAccessToken();
  if (!token) {
    redirect(`/${locale}/login`);
  }

  // 2. Fetch profile
  let profile: Profile | null = null;
  try {
    const response = await authServiceServer.getProfile();
    profile = response.data || null;
  } catch {
    redirect(`/${locale}/login`);
  }
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  // 3. Superadmin / system admin → admin workspace
  if (profile.is_superadmin || profile.is_system_admin) {
    redirect(`/${locale}/admin`);
  }

  // 4. Fetch clubs, lọc "của tôi" theo permission
  let clubs: Club[] = [];
  try {
    const res = await clubServiceServer.list({ limit: 100 });
    clubs = (res.data ?? []).filter((c) =>
      canAccessClub(profile!.permissions, profile!.is_superadmin, c.id),
    );
  } catch {
    // Lỗi fetch → coi như 0 club, render NoClubClient
    clubs = [];
  }

  // 5. 1 club → vào thẳng workspace
  if (clubs.length === 1) {
    const slug =
      pickSlugByLocale(clubs[0], locale) ?? String(clubs[0].id);
    redirect(`/${locale}/club/${slug}/dashboard`);
  }

  // 6. 2+ clubs → render danh sách chọn club
  if (clubs.length >= 2) {
    return (
      <LandingShell profile={profile}>
        <ClubsPageClient clubs={clubs} />
      </LandingShell>
    );
  }

  // 7. 0 club → trang xin vào CLB (render tại chỗ, KHÔNG redirect)
  return (
    <LandingShell profile={profile}>
      <NoClubClient />
    </LandingShell>
  );
}
