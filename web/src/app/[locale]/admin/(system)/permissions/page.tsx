import { setRequestLocale } from "next-intl/server";
import { PermissionsPageClient } from "@/domains/permission/PermissionsPageClient";

export default async function AdminPermissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PermissionsPageClient />;
}
