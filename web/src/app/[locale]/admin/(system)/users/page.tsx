import { setRequestLocale } from "next-intl/server";
import { UsersPageClient } from "@/domains/user/UsersPageClient";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UsersPageClient />;
}