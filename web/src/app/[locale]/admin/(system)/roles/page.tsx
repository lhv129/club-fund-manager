import { setRequestLocale } from "next-intl/server";
import { RolesPageClient } from "@/domains/role/RolesPageClient";

export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RolesPageClient />;
}
