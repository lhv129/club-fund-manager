import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { canAccessClub } from "@/lib/permissions";
import { LandingShell } from "@/components/shared/layout/LandingShell";
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

  // 1. Fetch profile (serverAdapter tự refresh nếu access token hết hạn)
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

  // 4. Fetch clubs
  const LIMIT = 10;
  let clubs: Club[] = [];
  let total = 0;
  try {
    const res = await clubServiceServer.list({
      limit: LIMIT,
    });
    // Backend đã trả về clubs của user → không cần filter lại ở đây.
    // canAccessClub dùng cho gate check (layout), không dùng cho list pagination.
    clubs = res.data ?? [];
    total = res.meta?.total ?? clubs.length;
  } catch {
    clubs = [];
    total = 0;
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
        <ClubsPageClient clubs={clubs} total={total} />
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
