import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import type { Profile } from "@/domains/auth/types";
import { AdminShell } from "@/components/layout/AdminShell";

/**
 * Admin workspace layout — auth guard + profile hydration.
 *
 * KHÔNG check permission system ở đây — vì /admin/clubs (chọn club) và
 * /admin/no-club (xin vào CLB) phải truy cập được bởi mọi user đã login.
 * Permission gate cho system pages (users/roles/permissions/settings/dashboard)
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

  // Server-side auth check — redirect to login if no token
  const token = await getAccessToken();
  if (!token) {
    redirect(`/${locale}/login`);
  }

  // Fetch profile server-side — hydrate client store
  let profile: Profile | null = null;
  try {
    const response = await authServiceServer.getProfile();
    profile = response.data;
  } catch {
    // Token invalid — redirect to login
    redirect(`/${locale}/login`);
  }

  if (!profile) {
    redirect(`/${locale}/login`);
  }

  return <AdminShell profile={profile}>{children}</AdminShell>;
}
