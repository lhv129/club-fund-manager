import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * Root path "/" → redirect to default locale.
 * next-intl middleware handles this, but this page acts as a fallback.
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
