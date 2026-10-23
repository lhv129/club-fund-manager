"use client";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { CLUB_SUBROUTES, clubRoute } from "@/constants";
import { Link } from "@/i18n/routing";
import { formatAmount } from "@/utils";
import {
  Badge,
  type BadgeVariant,
} from "@/components/shared/ui/Badge";
import { FundPeriodDate } from "@/components/shared/ui/FundPeriodDate";

import type { DashboardSession } from "../types";
import { DashboardCard, DashboardState } from "./DashboardCard";

type SessionStatus = "upcoming" | "completed" | "cancelled";
type SessionType = "scheduled" | "manual";

const STATUS_VARIANTS: Record<SessionStatus, BadgeVariant> = {
  upcoming: "upcoming",
  completed: "completed",
  cancelled: "cancelled",
};

const TYPE_VARIANTS: Record<SessionType, BadgeVariant> = {
  scheduled: "scheduled",
  manual: "manual",
};

function parseSessionDate(sessionDate: string) {
  const date = new Date(sessionDate.slice(0, 10) + "T00:00:00");
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSessionDate(sessionDate: string, locale: string) {
  const date = parseSessionDate(sessionDate);

  if (!date) return sessionDate;

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function SessionBadges({
  status,
  type,
  t,
}: {
  status: string;
  type: string;
  t: (key: string) => string;
}) {
  const statusVariant =
    STATUS_VARIANTS[status as SessionStatus] ?? "normal";
  const typeVariant =
    TYPE_VARIANTS[type as SessionType] ?? "normal";

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Badge
        variant={statusVariant}
        title={t("sessions.status." + status)}
        showDot
      />
      <Badge
        variant={typeVariant}
        title={t("sessions.type." + type)}
        showDot={false}
      />
    </div>
  );
}

function SessionMeta({
  session,
  t,
}: {
  session: DashboardSession;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground-muted">
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="size-3.5 shrink-0" />
        <span>
          {session.start_time} – {session.end_time}
        </span>
      </span>

      <span className="hidden h-3 w-px bg-border sm:block" />

      <span className="inline-flex min-w-0 items-center gap-1.5">
        <MapPin className="size-3.5 shrink-0" />
        <span className="max-w-[260px] truncate">
          {session.court_address || session.court_name}
        </span>
      </span>

      <span className="hidden h-3 w-px bg-border sm:block" />

      <span className="inline-flex items-center gap-1.5">
        <Users className="size-3.5 shrink-0" />
        <span>
          {session.player_count} {t("common.guest")}
        </span>
      </span>
    </div>
  );
}

function SessionFinancial({
  session,
  locale,
  t,
}: {
  session: DashboardSession;
  locale: string;
  t: (key: string) => string;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border pt-3 sm:min-w-[170px] sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 sm:text-right">
      <div className="sm:w-full">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("sessions.amountPerGuest")}
        </p>
        <p className="mt-1 text-sm font-bold text-foreground">
          {formatAmount(
            Number(session.amount_per_player),
            "₫",
            locale,
          )}
        </p>
      </div>

      <div className="sm:mt-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("sessions.totalAmount")}
        </p>
        <p className="mt-1 text-sm font-bold text-primary">
          {formatAmount(
            Number(session.total_amount),
            "₫",
            locale,
          )}
        </p>
      </div>
    </div>
  );
}

export function ClubUpcomingSessions({
  data,
  slug,
  locale,
}: {
  data: DashboardSession[];
  slug: string;
  locale: string;
}) {
  const t = useTranslations("clubDashboard");

  return (
    <DashboardCard
      icon={CalendarDays}
      title={t("sessions.title")}
      description={t("sessions.description")}
      action={
        <Link
          href={clubRoute(
            slug,
            CLUB_SUBROUTES.exchangeSessions,
          )}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          {t("sessions.viewSchedule")}
          <ArrowRight className="size-4" />
        </Link>
      }
    >
      {!data.length ? (
        <DashboardState
          message={t("sessions.noUpcomingSessions")}
        />
      ) : (
        <div className="divide-y divide-border">
          {data.map((session) => (
            <article
              key={session.id}
              className="flex flex-col gap-4 px-4 py-5 sm:px-5 lg:flex-row lg:items-center lg:gap-5"
            >
              <FundPeriodDate
                sessionDate={session.session_date}
                locale={locale}
                size="compact"
              />

              <div className="min-w-0 flex-1">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-foreground sm:text-base">
                      {session.court_name}
                    </h3>
                    <SessionBadges
                      status={session.status}
                      type={session.type}
                      t={t}
                    />
                  </div>

                  <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-foreground-muted">
                    <CalendarDays className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {formatSessionDate(
                        session.session_date,
                        locale,
                      )}
                    </span>
                  </p>
                </div>

                <SessionMeta session={session} t={t} />
              </div>

              <SessionFinancial
                session={session}
                locale={locale}
                t={t}
              />
            </article>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}