import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WebhookConfigsPageClient } from "@/domains/webhookConfig/WebhookConfigsPageClient";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.webhookConfigs" });
  return { title: t("title"), description: t("description") };
}

export default async function ClubWebhookConfigsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WebhookConfigsPageClient scope="club" />;
}
