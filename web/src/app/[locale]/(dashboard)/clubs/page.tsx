import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Breadcrumb } from "@/components/layout/Breadcrumb";


export default async function ClubsPage({
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
      <Breadcrumb />
      <h1 className="text-2xl font-bold text-zinc-900">{t("clubs")}</h1>
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-zinc-400">{tCommon("comingSoon")}</p>
        </div>
      </Card>
    </div>
  );
}
