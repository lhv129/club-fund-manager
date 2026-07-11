import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import type { Profile } from "@/domains/auth/types";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
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
    redirect(`/${locale}/dang-nhap`);
  }

  // Fetch profile server-side — hydrate client store
  let profile: Profile | null = null;
  try {
    const response = await authServiceServer.getProfile();
    profile = response.data;
  } catch {
    // Token invalid — redirect to login
    redirect(`/${locale}/dang-nhap`);
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
