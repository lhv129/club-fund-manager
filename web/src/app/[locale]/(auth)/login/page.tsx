import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/domains/auth/components/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginForm />;
}
