import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { ensureProfile } from "@/lib/auth/ensureProfile";
import { hasAnySystemPermission } from "@/lib/permissions";
import type { Profile } from "@/domains/auth/types";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { APP_ROUTES } from "@/constants";

/**
 * Fetch profile — cache qua React cache() để tránh gọi lại khi
 * admin/layout và các page con đều cần.
 *
 * Dùng ensureProfile để recover session khi access_token hết hạn
 * (redirect qua /api/auth/refresh?next= rồi quay lại).
 * ensureProfile không return null — nó throw redirect khi recover thất bại.
 */
const getProfile = cache(async (locale: string): Promise<Profile> => {
  return ensureProfile(locale, `/${locale}${APP_ROUTES.admin}`);
});

/**
 * Admin workspace layout — /admin/...
 *
 * Gate: chỉ superadmin / is_system_admin / có bất kỳ system permission
 * mới được vào.
 *
 * Club user (owner/manager/member, không có system scope)
 * → redirect về root "/" để root page tự phân luồng.
 */
export default async function AdminLayout({
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
    hasAnySystemPermission(
      profile.permissions,
      profile.is_superadmin,
    );

  if (!isSystemUser) {
    // Root page sẽ tự phân luồng:
    // - 1 club  -> /club/{slug}/dashboard
    // - nhiều club -> trang chọn club
    // - 0 club -> NoClub
    redirect(`/${locale}${APP_ROUTES.home}`);
  }

  return <AdminShell profile={profile}>{children}</AdminShell>;
}