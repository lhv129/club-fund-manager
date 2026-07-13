import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import type { Profile } from "@/domains/auth/types";
import type { Club } from "@/domains/club/types";
import { ClubShell } from "@/components/layout/ClubShell";

/**
 * Club workspace layout — /club/[slug]/...
 *
 * Server-side:
 *  1. Auth guard — redirect login nếu không token.
 *  2. Fetch profile.
 *  3. Fetch club theo slug (BE resolve qua club_translations.slug + locale).
 *  4. Permission gate — superadmin bypass; còn lại kiểm user có bất kỳ
 *     permission nào trong club.id không. Không có → 404.
 */
export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
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
    profile = response.data;
  } catch {
    redirect(`/${locale}/login`);
  }

  if (!profile) {
    redirect(`/${locale}/login`);
  }

  // 3. Fetch club theo slug
  let club: Club | null = null;
  try {
    const res = await clubServiceServer.showBySlug(slug);
    if (res.success) club = res.data;
  } catch {
    // slug không tồn tại / lỗi → 404
    notFound();
  }

  if (!club) notFound();

  // 4. Permission gate
  const canAccess = canAccessClub(profile, club.id);
  if (!canAccess) {
    notFound();
  }

  return (
    <ClubShell profile={profile} club={club}>
      {children}
    </ClubShell>
  );
}

/**
 * Kiểm user có quyền truy cập workspace của club này không.
 * - Superadmin / permissions ['*'] → luôn true.
 * - Còn lại: có bất kỳ entry permissions[clubId] nào không rỗng.
 */
function canAccessClub(profile: Profile, clubId: number): boolean {
  if (profile.is_superadmin) return true;

  const perms = profile.permissions;
  // ['*'] → full quyền
  if (Array.isArray(perms) && perms.includes("*")) return true;

  if (!perms || typeof perms !== "object" || Array.isArray(perms)) {
    return false;
  }

  const clubPerms = (perms as Record<string, Record<string, string[]>>)[
    String(clubId)
  ];
  if (!clubPerms) return false;

  // Có ít nhất một module với action nào đó
  return Object.values(clubPerms).some(
    (actions) => Array.isArray(actions) && actions.length > 0,
  );
}
