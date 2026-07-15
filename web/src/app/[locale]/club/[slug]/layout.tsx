import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { canAccessClub } from "@/lib/permissions";
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
 *  4. Permission gate — superadmin bypass; admin không có club scope → 404;
 *     owner/manager/member kiểm `canAccessClub(permissions, club.id)`.
 *
 * Xem docs/permission-guide.md §6.
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
    profile = response.data || null;
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
    if (res.success) club = res.data || null;
  } catch {
    // slug không tồn tại / lỗi → 404
    notFound();
  }

  if (!club) notFound();

  // 4. Permission gate — dùng helper canAccessClub.
  if (!canAccessClub(profile.permissions, profile.is_superadmin, club.id)) {
    notFound();
  }

  return (
    <ClubShell profile={profile} club={club}>
      {children}
    </ClubShell>
  );
}
