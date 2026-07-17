import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UsersPageClient } from "@/domains/user/UsersPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: "metadata.users",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AdminUsersPage({
  params,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UsersPageClient />;
}