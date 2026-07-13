import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { MODULE_SLUGS, PERMISSION_ACTIONS, APP_ROUTES } from "@/constants";
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
    return res.data;
  } catch {
    return null;
  }
});

/**
 * Kiểm user có permission truy cập system pages không.
 * - Superadmin → true.
 * - permissions ['*'] → true.
 * - Có view trên user/role/permission → true.
 */
function canAccessSystem(profile: Profile): boolean {
  if (profile.is_superadmin) return true;
  const perms = profile.permissions;
  if (Array.isArray(perms) && perms.includes("*")) return true;
  if (!perms || typeof perms !== "object" || Array.isArray(perms)) return false;

  const systemModules = [
    MODULE_SLUGS.user,
    MODULE_SLUGS.role,
    MODULE_SLUGS.permission,
  ];
  return Object.values(perms as Record<string, Record<string, string[]>>).some(
    (modules) =>
      systemModules.some((m) =>
        modules?.[m]?.includes(PERMISSION_ACTIONS.view),
      ),
  );
}

/**
 * (system) layout — permission gate cho system pages.
 *
 * Chỉ superadmin hoặc user có permission view trên user/role/permission
 * mới vào được /dashboard (dashboard), /dashboard/users, /dashboard/roles,
 * /dashboard/permissions, /dashboard/settings. Manager (chỉ có quyền trên club)
 * bị redirect về /dashboard/clubs để chọn club.
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

  if (!canAccessSystem(profile)) {
    redirect(`/${locale}${APP_ROUTES.adminClubs}`);
  }

  return <>{children}</>;
}
