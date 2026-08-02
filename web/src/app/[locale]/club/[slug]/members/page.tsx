// src/app/[locale]/club/[slug]/members/page.tsx

import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MembersPageClient } from "@/domains/members/MembersPageClient";

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
    namespace: "metadata.members",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ClubMembersPage({
  params,
}: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <MembersPageClient />;
}