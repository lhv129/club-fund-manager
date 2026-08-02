import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { canAccessClub, hasAnySystemPermission, isClubKey } from "@/lib/permissions"; //  thêm isClubKey
import { ensureProfile } from "@/lib/auth/ensureProfile";
import type { Club } from "@/domains/club/types";
import { ClubShell } from "@/components/club/layout/ClubShell";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";

/**
 * Đếm số club từ permissions — xử lý đúng cả 4 shape của PermissionMap:
 *   Shape 1: ["*"]          → superadmin, array → trả 0 (caller tự handle is_superadmin)
 *   Shape 2: { module: [] } → flat system keys → 0 club_* keys
 *   Shape 3: { club_1: {} } → nested club keys → đếm được
 *   Shape 4: hybrid          → mix flat + nested → đếm đúng club_* keys
 */
function countClubsFromPermissions(permissions: unknown): number {
  // Shape 1: ["*"] là array → guard trước Object.keys
  if (!permissions || Array.isArray(permissions) || typeof permissions !== "object") {
    return 0;
  }
  // Dùng isClubKey từ lib/permissions (key → /^club_\d+$/)
  return Object.keys(permissions as Record<string, unknown>).filter(isClubKey).length;
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const currentPath = `/${locale}${clubRoute(slug, CLUB_SUBROUTES.dashboard)}`;
  const profile = await ensureProfile(locale, currentPath);

  //  Zero API call — đọc từ profile có sẵn
  const clubCount = countClubsFromPermissions(profile.permissions);

  const hasMultipleClubs =
    profile.is_superadmin ||   // Shape 1: ["*"] → bypass, luôn hiện "back"
    profile.is_system_admin || // system admin thấy tất cả clubs
    clubCount >= 2;             // club user: đếm club_* keys

  // Fetch club hiện tại — call duy nhất trong layout
  let club: Club | null = null;
  try {
    const res = await clubServiceServer.showBySlug(slug);
    if (res.success) club = res.data || null;
  } catch {
    notFound();
  }

  if (!club) notFound();

  const isSystemAdmin =
    (profile.is_system_admin ?? false) ||
    hasAnySystemPermission(profile.permissions, false);

  if (!canAccessClub(profile.permissions, profile.is_superadmin, club.id, isSystemAdmin)) {
    notFound();
  }

  return (
    <ClubShell profile={profile} club={club} hasMultipleClubs={hasMultipleClubs}>
      {children}
    </ClubShell>
  );
}