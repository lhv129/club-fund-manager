import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { hasAnySystemPermission } from "@/lib/permissions";
import type { Profile } from "@/domains/auth/types";
import { AdminShell } from "@/components/layout/AdminShell";

/**
 * Fetch profile — cache qua React cache() để tránh gọi lại khi
 * admin/layout và các page con đều cần.
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
 * Admin workspace layout — /admin/...
 *
 * Gate: chỉ superadmin / is_system_admin / có bất kỳ system permission mới vào được.
 * Club user (owner/manager/member, không có system scope) → redirect về root "/"
 * để root page phân luồng (chọn club / no-club). KHÔNG redirect thẳng /club vì
 * root đã lo.
 *
 * Permission gate chi tiết cho từng system page (users/roles/permissions/settings)
 * nằm ở (system)/layout.tsx.
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

  const profile = await getProfile();
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  // Gate admin workspace — superadmin | system admin | có system permission.
  const isSystemUser =
    profile.is_superadmin ||
    profile.is_system_admin ||
    hasAnySystemPermission(profile.permissions, profile.is_superadmin);

  if (!isSystemUser) {
    // Club user → về root để root phân luồng (chọn club / no-club).
    redirect(`/${locale}`);
  }

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
