import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RolesPageClient } from "@/domains/role/RolesPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: "metadata.roles",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}


export default async function AdminRolesPage({
  params,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RolesPageClient />;
}
