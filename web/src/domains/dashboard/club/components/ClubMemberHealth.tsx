import {
  Archive,
  ArrowRight,
  CircleUserRound,
  Clock3,
  Sparkles,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { CLUB_SUBROUTES, clubRoute } from "@/constants";
import type { DashboardMemberStats } from "../types";
import { Link } from "@/i18n/routing";
import { DashboardCard } from "./DashboardCard";

type DashboardMemberStatsApi = DashboardMemberStats & {
  pending_members?: number | string | null;
  rejected_members?: number | string | null;
  removed_members?: number | string | null;
};

export function ClubMemberHealth({
  data,
  slug,
}: {
  data: DashboardMemberStats;
  slug: string;
}) {
  const t = useTranslations("clubDashboard");
  const apiData = data as DashboardMemberStatsApi;

  const total = Math.max(0, Number(data.total) || 0);
  const active = Math.max(0, Number(data.active) || 0);
  const activeRate =
    total > 0 ? Math.min((active / total) * 100, 100) : 0;

  const metrics = [
    {
      label: t("members.active"),
      value: active,
      icon: UserCheck,
      tone: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: t("members.inactiveMembers"),
      value: Math.max(0, Number(data.inactive) || 0),
      icon: UserMinus,
      tone: "text-foreground-muted bg-background-muted",
    },
    {
      label: t("members.newMembers"),
      value: Math.max(0, Number(data.new_members) || 0),
      icon: Sparkles,
      tone: "text-blue-500 bg-blue-500/10",
    },
    {
      label: t("members.pendingMembers"),
      value: Math.max(0, Number(apiData.pending_members) || 0),
      icon: Clock3,
      tone: "text-amber-500 bg-amber-500/10",
    },
    {
      label: t("members.rejectedMembers"),
      value: Math.max(0, Number(apiData.rejected_members) || 0),
      icon: UserX,
      tone: "text-rose-500 bg-rose-500/10",
    },
    {
      label: t("members.removedMembers"),
      value: Math.max(0, Number(apiData.removed_members) || 0),
      icon: Archive,
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
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          {t("common.manage")}
          <ArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 min-[420px]:flex-row min-[420px]:items-center">
          <div className="mx-auto flex size-24 shrink-0 flex-col items-center justify-center rounded-full border-[8px] border-primary/15 bg-background sm:size-28 sm:border-[10px] min-[420px]:mx-0">
            <strong className="text-3xl tabular-nums text-foreground">
              {total}
            </strong>
            <span className="text-xs text-foreground-muted">
              {t("members.members")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t("members.activeRate")}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {t("members.membersTotal", {
                    active,
                    total,
                  })}
                </p>
              </div>

              <strong className="shrink-0 text-xl tabular-nums text-emerald-500">
                {activeRate.toFixed(1).replace(".", ",")}%
              </strong>
            </div>

            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-background-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(activeRate)}
              aria-label={t("members.activeRate")}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                style={{ width: activeRate + "%" }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-border pt-5 sm:gap-3">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex min-w-0 items-center gap-2.5 rounded-xl bg-background-subtle p-3 sm:gap-3"
            >
              <span
                className={
                  "flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9 " +
                  tone
                }
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>

              <div className="min-w-0">
                <p className="text-base font-bold tabular-nums text-foreground sm:text-lg">
                  {value}
                </p>
                <p className="break-words text-[11px] leading-tight text-foreground-muted sm:text-xs">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
