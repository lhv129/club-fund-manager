import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RolePermissionsPageClient } from "@/domains/role/RolePermissionsPageClient";


type Props = {
    params: Promise<{ locale: string; slug: string }>;
};


export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: "metadata.rolePermissions",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RolePermissionsPage({
    params,
}: Props) {
    const { slug } = await params;

    return <RolePermissionsPageClient slug={slug} />;
}
