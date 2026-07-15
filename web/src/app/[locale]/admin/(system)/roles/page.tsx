import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("menu");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{t("roles")}</h1>
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-zinc-400">{tCommon("comingSoon")}</p>
        </div>
      </Card>
    </div>
  );
}
