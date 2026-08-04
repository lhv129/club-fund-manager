import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card } from "@/components/shared/ui/Card";

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: "metadata.clubDashboard",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ClubDashboardPage({
  params,
}: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  const tWorkspace = await getTranslations("clubWorkspace");

  const stats = [
    { key: "totalMembers", value: "—", icon: "👥" },
    { key: "totalFunds", value: "—", icon: "💰" },
    { key: "activeEvents", value: "—", icon: "📅" },
    { key: "monthlyIncome", value: "—", icon: "📈" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          {tWorkspace("dashboard")}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-2xl">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-zinc-500">
                  {tWorkspace(stat.key)}
                </p>
                <p className="text-2xl font-bold text-zinc-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}