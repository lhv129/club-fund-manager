// src/app/[locale]/club/[slug]/members/page.tsx
import { setRequestLocale } from "next-intl/server";
import { MembersPageClient } from "@/domains/members/MembersPageClient";

export default async function ClubMembersPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MembersPageClient />;
}
