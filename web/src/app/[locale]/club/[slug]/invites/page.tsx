// src/app/[locale]/club/[slug]/invites/page.tsx
import { setRequestLocale } from "next-intl/server";
import { ClubInvitesPageClient } from "@/domains/invites/ClubInvitesPageClient";

export default async function ClubInvitesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ClubInvitesPageClient />;
}
