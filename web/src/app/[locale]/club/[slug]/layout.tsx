import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { canAccessClub, hasAnySystemPermission } from "@/lib/permissions";
import type { Profile } from "@/domains/auth/types";
import type { Club } from "@/domains/club/types";
import { ClubShell } from "@/components/club/layout/ClubShell";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // 1. Fetch profile
  let profile: Profile | null = null;
  try {
    const response = await authServiceServer.getProfile();
    profile = response.data || null;
  } catch {
    redirect(`/${locale}/login`);
  }

  if (!profile) redirect(`/${locale}/login`);

  // 2. Fetch club theo slug
  let club: Club | null = null;
  try {
    const res = await clubServiceServer.showBySlug(slug);
    if (res.success) club = res.data || null;
  } catch {
    notFound();
  }

  if (!club) notFound();

  // 3. Permission gate
  // isSystemAdmin: flag từ BE hoặc detect qua flat permission shape
  const isSystemAdmin =
    (profile.is_system_admin ?? false) ||
    hasAnySystemPermission(profile.permissions, false);

  if (!canAccessClub(profile.permissions, profile.is_superadmin, club.id, isSystemAdmin)) {
    notFound();
  }

  return (
    <ClubShell profile={profile} club={club}>
      {children}
    </ClubShell>
  );
}