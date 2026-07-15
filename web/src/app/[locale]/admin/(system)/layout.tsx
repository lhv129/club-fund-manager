import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { systemPermissions } from "@/lib/permissions";
import type { Profile } from "@/domains/auth/types";

/**
 * Fetch profile — cache qua React cache() để tránh gọi lại khi
 * (system)/layout và các page con đều cần.
 */
const getProfile = cache(async (): Promise<Profile | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await authServiceServer.getProfile();
    return res.data || null;
  } catch {
    return null;
  }
});

/**
 * (system) layout — permission gate cho system pages.
 *
 * Chỉ superadmin hoặc user có system permission (admin) mới vào được
 * /admin (dashboard), /admin/users, /admin/roles, /admin/permissions,
 * /admin/settings. Club user (owner/manager/member) không có system
 * permission → redirect về root "/" để root phân luồng (chọn club / no-club).
 *
 * Xem docs/permission-guide.md §6.
 */
export default async function SystemLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getProfile();
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  // Superadmin → qua. Admin (is_system_admin) → có system permission → qua.
  // Club user (không có system scope) → redirect về root để phân luồng.
  const isSystemUser =
    profile.is_superadmin ||
    profile.is_system_admin ||
    systemPermissions(profile.permissions) !== null;

  if (!isSystemUser) {
    redirect(`/${locale}`);
  }

  return <>{children}</>;
}
