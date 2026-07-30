import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { ensureProfile } from "@/lib/auth/ensureProfile";
import { LandingShell } from "@/components/shared/layout/LandingShell";
import { ClubsPageClient } from "@/domains/club/ClubsPageClient";
import { NoClubClient } from "@/domains/club/NoClubClient";
import type { Club, Translation } from "@/domains/club/types";
import { APP_ROUTES, clubDashboardRoute } from "@/constants";

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
 *
 * 1. Chưa login                → /{locale}/login
 * 2. superadmin / system admin → /{locale}/admin
 * 3. 1 club truy cập được      → /{locale}/club/{slug}/dashboard
 * 4. 2+ clubs                  → render <ClubsPageClient />
 * 5. 0 club                    → render <NoClubClient /> (KHÔNG redirect)
 */
export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Recover session nếu access token hết hạn
  const profile = await ensureProfile(locale, `/${locale}`);

  // System admin → admin workspace
  if (profile.is_superadmin || profile.is_system_admin) {
    redirect(`/${locale}${APP_ROUTES.admin}`);
  }

  // Lấy danh sách CLB user có quyền truy cập
  const LIMIT = 10;
  let clubs: Club[] = [];
  let total = 0;

  try {
    const res = await clubServiceServer.list({
      limit: LIMIT,
    });

    clubs = res.data ?? [];
    total = res.meta?.total ?? clubs.length;
  } catch {
    clubs = [];
    total = 0;
  }

  // Chỉ có 1 CLB → vào thẳng dashboard
  if (clubs.length === 1) {
    const slug =
      pickSlugByLocale(clubs[0], locale) ?? String(clubs[0].id);

    redirect(`/${locale}${clubDashboardRoute(slug)}`);
  }

  // Có nhiều CLB → hiển thị trang chọn CLB
  if (clubs.length >= 2) {
    return (
      <LandingShell profile={profile}>
        <ClubsPageClient clubs={clubs} total={total} />
      </LandingShell>
    );
  }

  // Không thuộc CLB nào
  return (
    <LandingShell profile={profile}>
      <NoClubClient />
    </LandingShell>
  );
}