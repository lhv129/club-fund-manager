import { setRequestLocale } from "next-intl/server";
import { NoClubClient } from "@/domains/club/NoClubClient";

export default async function NoClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NoClubClient />;
}
