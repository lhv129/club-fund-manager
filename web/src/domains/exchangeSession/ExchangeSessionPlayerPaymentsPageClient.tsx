"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import Select from "@/components/shared/ui/Select";
import { Badge } from "@/components/shared/ui/Badge";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import { DataTable } from "@/components/shared/ui/DataTable";
import type { ColumnDef } from "@/components/shared/ui/Table";
import { formatAmount } from "@/utils";
import { useListParams } from "@/hooks/useListParams";
import { getTranslatedTitle } from "@/lib/translations";
import type { Translation } from "@/domains/club/types";
import { useExchangeSessionSelect } from "./hooks/useExchangeSessions";
import { useExchangeSessionPlayers } from "./hooks/useExchangeSessionPlayers";
import type { ExchangeSessionPlayer, ExchangeSessionPlayerFilters } from "./types";

export function ExchangeSessionPlayerPaymentsPageClient() {
    const { slug } = useParams<{ slug: string }>();
    const locale = useLocale();
    const t = useTranslations("common");
    const x = useTranslations("exchangeSession");

    const { params, setPage, setLimit, updateMany, reset } = useListParams<ExchangeSessionPlayerFilters>({
        defaultFilters: { search: "", exchange_session_id: undefined, paid: undefined },
        defaultSortBy: "created_at",
        defaultSortDir: "desc",
        defaultLimit: 15,
    });
    const [draftSessionId, setDraftSessionId] = useState(params.exchange_session_id ? String(params.exchange_session_id) : "");
    const [draftPaid, setDraftPaid] = useState<0 | 1 | undefined>(params.paid === undefined ? undefined : Number(params.paid) as 0 | 1);
    const sessions = useExchangeSessionSelect({ club_slug: slug });
    const players = useExchangeSessionPlayers({ ...params, club_slug: slug });

    const columns: ColumnDef<ExchangeSessionPlayer>[] = [
        { key: "session", label: x("session"), render: (row) => {
            const session = row.exchange_session;
            if (!session) return `#${row.exchange_session_id}`;
            const schedule = session.playing_schedule;
            const title = getTranslatedTitle(schedule?.translations as Translation[] | undefined, locale) || schedule?.title || `#${session.id}`;
            return <div><p className="whitespace-nowrap text-sm font-medium">{title}</p><p className="text-xs text-foreground-muted">{session.session_date} · #{session.id}</p></div>;
        } },
        { key: "player", label: x("groupName"), render: (row) => <div><p className="font-medium">{row.user?.fullname || row.group_name || "—"}</p>{row.user && row.group_name && <p className="text-xs text-foreground-muted">{row.group_name}</p>}</div> },
        { key: "male", label: x("male"), className: "text-center", render: (row) => row.male },
        { key: "female", label: x("female"), className: "text-center", render: (row) => row.female },
        { key: "amount", label: x("amount"), render: (row) => formatAmount(row.amount, "₫", locale) },
        { key: "paid", label: x("paid"), render: (row) => <div className="flex items-center gap-2"><ToggleSwitch checked={row.paid} loading={players.payingIds.has(row.id)} onChange={() => players.handleTogglePaid(row)} /><Badge variant={row.paid ? "active" : "pending"} title={row.paid ? x("paidYes") : x("paidNo")} /></div> },
        { key: "warning", label: x("warning"), render: (row) => {
            const message = row.warning_message?.find((item) => item.locale === locale)?.message || row.warning_message?.[0]?.message;
            if (row.warning_level === "none") return <Badge variant="normal" title={x("noWarning")} />;
            return <Badge variant={row.warning_level} title={message || x(`warningLevel_${row.warning_level}`)} />;
        } },
    ];

    const sessionOptions = sessions.data.map((session) => ({ value: String(session.id), label: `${session.session_date} · ${session.court_name}` }));

    return <div className="space-y-6">
        <div><h1 className="text-xl font-semibold text-foreground">{x("playerPaymentTracking")}</h1><p className="mt-1 text-sm text-foreground-muted">{x("playerPaymentTrackingDescription")}</p></div>
        <FilterBar
            search={params.search ?? ""}
            sortBy={params.sort_by}
            sortDir={params.sort_dir}
            sortOptions={[{ value: "session_date", label: x("sessionDate") }, { value: "created_at", label: t("createdAt") }, { value: "amount", label: x("amount") }, { value: "paid", label: x("paid") }, { value: "sort_order", label: t("sortOrder") }]}
            showStatusFilter={false}
            loading={players.isFetching}
            onApply={(filters: AppliedFilters) => updateMany({ search: filters.search, sort_by: filters.sort_by, sort_dir: filters.sort_dir, exchange_session_id: draftSessionId ? Number(draftSessionId) : undefined, paid: draftPaid })}
            onReset={() => { setDraftSessionId(""); setDraftPaid(undefined); reset(); }}
            extraFilters={<><div className="w-full sm:w-64"><span className="mb-1 block text-xs font-medium text-foreground-muted">{x("session")}</span><Select label={x("session")} options={sessionOptions} value={draftSessionId} onChange={setDraftSessionId} loading={sessions.isLoading} placeholder={t("all")} /></div><div className="w-full sm:w-40"><span className="mb-1 block text-xs font-medium text-foreground-muted">{x("paid")}</span><Select label={x("paid")} options={[{ value: "1", label: x("paidYes") }, { value: "0", label: x("paidNo") }]} value={draftPaid === undefined ? "" : String(draftPaid)} onChange={(value) => setDraftPaid(value ? Number(value) as 0 | 1 : undefined)} placeholder={t("all")} /></div></>}
        />
        <DataTable table={{ columns, data: players.data, loading: players.isLoading, fetching: players.isFetching, keyExtractor: (row) => row.id, emptyText: x("noPlayers"), showActions: false }} pagination={{ page: params.page, limit: params.limit, total: players.total, onPageChange: setPage, onLimitChange: setLimit }} />
    </div>;
}
