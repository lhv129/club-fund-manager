import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/shared/ui/Card";
import { Users, Building2, KeyRound, CheckCircle2 } from "lucide-react";

const STATS = [
  { key: "totalUsers", icon: Users, color: "text-blue-500  bg-blue-500/10" },
  { key: "totalClubs", icon: Building2, color: "text-violet-500 bg-violet-500/10" },
  { key: "totalRoles", icon: KeyRound, color: "text-amber-500  bg-amber-500/10" },
  { key: "activeClubs", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
] as const;

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">{t("title")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ key, icon: Icon, color }) => (
          <Card key={key}>
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-fg-muted truncate">{t(key)}</p>
                <p className="text-2xl font-bold text-fg">—</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}