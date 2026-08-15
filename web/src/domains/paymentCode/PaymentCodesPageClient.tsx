"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, Search, RotateCcw } from "lucide-react";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { DataTable } from "@/components/shared/ui/DataTable";
import { Badge } from "@/components/shared/ui/Badge";
import Select from "@/components/shared/ui/Select";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import type { ColumnDef } from "@/components/shared/ui/Table";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useClub } from "@/domains/club/hooks/useClub";
import { useListParams } from "@/hooks/useListParams";
import { usePaymentCodes } from "@/domains/paymentCode/hooks/usePaymentCodes";
import type { PaymentCode, PaymentCodeFilters, PaymentCodeStatus } from "@/domains/paymentCode/types";
import { useRouter } from "@/i18n/routing";
import { formatAmount, formatDateTime } from "@/utils";

export function PaymentCodesPageClient() {
    const t = useTranslations("common");
    const tp = useTranslations("paymentCode");
    const locale = useLocale();
    const router = useRouter();
    const { club, slug } = useClub();
    const { params, setPage, setLimit, updateMany, reset } = useListParams<PaymentCodeFilters>({
        defaultFilters: { monthly_contribution_id: undefined, status: undefined },
        defaultSortBy: "created_at",
        defaultSortDir: "desc",
    });
    const [contributionId, setContributionId] = useState(params.monthly_contribution_id ? String(params.monthly_contribution_id) : "");
    const [status, setStatus] = useState<PaymentCodeStatus | undefined>(params.status);
    const query = usePaymentCodes({ ...params, club_slug: slug });

    if (!club || !slug) return null;

    const columns: ColumnDef<PaymentCode>[] = [
        { key: "payment_code", label: tp("code"), render: (row) => <span className="font-mono text-sm font-semibold tracking-wide text-foreground">{row.payment_code}</span> },
        { key: "member", label: tp("member"), render: (row) => <div><p className="text-sm font-medium text-foreground">{row.monthly_contribution?.user?.fullname || "—"}</p><p className="text-xs text-foreground-muted">#{row.monthly_contribution_id}</p></div> },
        { key: "period", label: tp("period"), render: (row) => row.monthly_contribution?.period ? <span className="whitespace-nowrap text-sm">{tp("periodValue", { month: row.monthly_contribution.period.month, year: row.monthly_contribution.period.year })}</span> : "—" },
        { key: "amount", label: tp("amount"), render: (row) => <span className="whitespace-nowrap text-sm font-medium tabular-nums">{formatAmount(row.monthly_contribution?.amount ?? "0", "đ", locale)}</span> },
        { key: "status", label: t("status"), render: (row) => <Badge variant={row.status === "used" ? "active" : row.status === "expired" ? "locked" : "pending"} title={tp(row.status)} /> },
        { key: "expired_at", label: tp("expiresAt"), render: (row) => <span className="whitespace-nowrap text-sm text-foreground-muted">{formatDateTime(row.expired_at, locale)}</span> },
        { key: "created_at", label: t("createdAt"), render: (row) => <span className="whitespace-nowrap text-sm text-foreground-muted">{formatDateTime(row.created_at, locale)}</span> },
    ];
    const listHref = clubRoute(slug, CLUB_SUBROUTES.paymentCodes);

    return <div className="space-y-6">
        <Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} />
        <header><h1 className="text-xl font-semibold text-foreground">{tp("title")}</h1><p className="mt-1 text-sm text-foreground-muted">{tp("totalCount", { count: query.total.toLocaleString() })}</p></header>
        <div className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-border bg-background px-3 py-3.5 shadow-sm sm:px-4">
            <label className="flex w-full min-w-0 flex-1 basis-full flex-col gap-1 sm:w-auto sm:basis-auto sm:min-w-56"><span className="text-xs font-medium text-foreground-muted">{tp("contributionId")}</span><input type="number" min={1} value={contributionId} onChange={(e) => setContributionId(e.target.value)} placeholder={tp("contributionIdPlaceholder")} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40" /></label>
            <div className="flex w-full flex-col gap-1 sm:w-auto"><span className="text-xs font-medium text-foreground-muted">{t("status")}</span><Select className="w-full sm:w-auto" label={t("status")} value={status ?? ""} onChange={(value) => setStatus((value || undefined) as PaymentCodeStatus | undefined)} placeholder={t("all")} options={[{ value: "pending", label: tp("pending") }, { value: "used", label: tp("used") }, { value: "expired", label: tp("expired") }]} /></div>
            <button type="button" onClick={() => { setContributionId(""); setStatus(undefined); reset(); }} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-foreground-muted hover:bg-background-subtle sm:w-auto"><RotateCcw className="h-3.5 w-3.5" />{t("reset")}</button>
            <button type="button" disabled={query.isFetching} onClick={() => updateMany({ monthly_contribution_id: contributionId ? Number(contributionId) : undefined, status })} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60 sm:w-auto"><Search className="h-4 w-4" />{t("searchButton")}</button>
        </div>
        <DataTable table={{ columns, data: query.data, loading: query.isLoading, fetching: query.isFetching, keyExtractor: (row) => row.id, showActions: true, renderActions: (row) => <TableActions><TableActionItem icon={<Eye className="h-4 w-4" />} label={t("view")} onClick={() => router.push(`${listHref}/${row.payment_code}` as never)} /></TableActions>, emptyText: tp("notFound") }} pagination={{ page: params.page, limit: params.limit, total: query.total, onPageChange: setPage, onLimitChange: setLimit }} />
    </div>;
}
