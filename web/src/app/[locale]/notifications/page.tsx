import { setRequestLocale } from "next-intl/server";
import { LandingShell } from "@/components/shared/layout/LandingShell";
import { NotificationsPageClient } from "@/domains/notification/NotificationsPageClient";
import { ensureProfile } from "@/lib/auth/ensureProfile";

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await ensureProfile(locale, `/${locale}/notifications`);
  return <LandingShell profile={profile}><NotificationsPageClient /></LandingShell>;
}
