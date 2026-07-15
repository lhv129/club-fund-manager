import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const stats = [
    { key: "totalUsers", value: "—", icon: "👤" },
    { key: "totalClubs", value: "—", icon: "🏛️" },
    { key: "totalRoles", value: "—", icon: "🔑" },
    { key: "activeClubs", value: "—", icon: "✅" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-2xl">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-zinc-500">{t(stat.key)}</p>
                <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
