import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { ensureProfile } from "@/lib/auth/ensureProfile";
import { systemPermissions } from "@/lib/permissions";
import type { Profile } from "@/domains/auth/types";
import { APP_ROUTES } from "@/constants";

/**
 * Fetch profile — cache qua React cache() để tránh gọi lại khi
 * (system)/layout và các page con đều cần.
 *
 * Dùng ensureProfile để recover session khi access_token hết hạn.
 */
const getProfile = cache(async (locale: string): Promise<Profile> => {
  return ensureProfile(locale, `/${locale}${APP_ROUTES.admin}`);
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

  const profile = await getProfile(locale);

  const isSystemUser =
    profile.is_superadmin ||
    profile.is_system_admin ||
    systemPermissions(profile.permissions) !== null;

  if (!isSystemUser) {
    redirect(`/${locale}${APP_ROUTES.home}`);
  }

  return <>{children}</>;
}