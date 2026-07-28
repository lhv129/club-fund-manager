// app/[locale]/admin/roles/[slug]/permissions/page.tsx
import "server-only";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RolePermissionsPageClient } from "@/domains/role/RolePermissionsPageClient";
import { roleServiceServer } from "@/domains/role/services/roleServiceServer";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  const [t, response] = await Promise.all([
    getTranslations({ locale, namespace: "metadata.rolePermissions" }),
    roleServiceServer.showBySlug(slug).catch(() => null),
  ]);

  const role = response?.data;

  return {
    title: `${t("title")} ${role?.translation?.name ?? slug}`,
    description: t("description"),
  };
}

export default async function RolePermissionsPage({ params }: Props) {
  const { slug } = await params;
  return <RolePermissionsPageClient slug={slug} />;
}