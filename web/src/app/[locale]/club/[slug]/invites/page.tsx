// src/app/[locale]/club/[slug]/invites/page.tsx

import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClubInvitesPageClient } from "@/domains/invites/ClubInvitesPageClient";

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: "metadata.invites",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ClubInvitesPage({
  params,
}: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <ClubInvitesPageClient />;
}