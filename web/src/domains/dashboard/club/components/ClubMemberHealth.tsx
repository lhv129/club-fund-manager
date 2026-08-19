import {
  ArrowRight,
  CircleUserRound,
  Sparkles,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { CLUB_SUBROUTES, clubRoute } from "@/constants";
import type { DashboardMemberStats } from "../types";
import { Link } from "@/i18n/routing";
import { DashboardCard } from "./DashboardCard";

export function ClubMemberHealth({
  data,
  slug,
}: {
  data: DashboardMemberStats;
  slug: string;
}) {
  const t = useTranslations("clubDashboard");

  const activeRate = data.total
    ? (data.active / data.total) * 100
    : 0;

  const metrics = [
    {
      label: t("members.active"),
      value: data.active,
      icon: UserCheck,
      tone: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: t("members.participating"),
      value: data.participating,
      icon: Users,
      tone: "text-primary bg-primary/10",
    },
    {
      label: t("members.newMembers"),
      value: data.new_members,
      icon: Sparkles,
      tone: "text-blue-500 bg-blue-500/10",
    },
    {
      label: t("members.inactiveMembers"),
      value: data.inactive,
      icon: UserMinus,
      tone: "text-foreground-muted bg-background-muted",
    },
  ];

  return (
    <DashboardCard
      icon={CircleUserRound}
      title={t("members.title")}
      description={t("members.description")}
      action={
        <Link
          href={clubRoute(slug, CLUB_SUBROUTES.members)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
        >
          {t("common.manage")}
          <ArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-28 shrink-0 flex-col items-center justify-center rounded-full border-[10px] border-primary/15 bg-background shadow-sm">
            <strong className="text-3xl text-foreground">
              {data.total}
            </strong>

            <span className="text-xs text-foreground-muted">
              {t("members.members")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("members.activeRate")}
                </p>

                <p className="mt-1 text-xs text-foreground-muted">
                  {t("members.membersTotal", {
                    active: data.active,
                    total: data.total,
                  })}
                </p>
              </div>

              <strong className="text-xl text-emerald-500">
                {activeRate.toFixed(1).replace(".", ",")}%
              </strong>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
                style={{
                  width: `${activeRate}%`,
                }}
              />
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
              <p className="text-sm font-semibold text-amber-500">
                {t("members.membersOutstanding", {
                  count: data.outstanding,
                })}
              </p>

              <p className="mt-0.5 text-xs text-foreground-muted">
                {t("financial.outstandingDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
          {metrics.map(
            ({
              label,
              value,
              icon: Icon,
              tone,
            }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-background-subtle p-3"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon className="size-4" />
                </span>

                <div>
                  <p className="text-lg font-bold text-foreground">
                    {value}
                  </p>

                  <p className="text-xs text-foreground-muted">
                    {label}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </DashboardCard>
  );
}