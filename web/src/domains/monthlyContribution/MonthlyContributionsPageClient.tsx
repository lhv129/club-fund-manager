// src/app/[locale]/club/[slug]/monthly-contributions/MonthlyContributionsPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Table, type ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import Select from "@/components/shared/ui/Select";
import { useListParams } from "@/hooks/useListParams";
import { useMonthlyContributions } from "@/domains/monthlyContribution/hooks/useMonthlyContributions";
import type {
    MonthlyContribution,
    MonthlyContributionFilters,
    ContributionStatus,
    ContributionPaidBy,
} from "@/domains/monthlyContribution/types";
import { formatAmount, formatDateTime } from "@/utils";
import { useClub } from "@/domains/club/hooks/useClub";
import { useAuth } from "@/domains/auth/hooks/useAuth";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<ContributionStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MonthlyContributionsPageClient() {
    const t = useTranslations("common");
    const tm = useTranslations("monthlyContribution");

    const { club, slug } = useClub();
    const { hasPermission, isSuperAdmin } = useAuth();
    const canUpdate = isSuperAdmin || hasPermission("monthly_contribution", "update", club?.id);
    const canCreate = isSuperAdmin || hasPermission("monthly_contribution", "create", club?.id);
    const canDelete = isSuperAdmin || hasPermission("monthly_contribution", "delete", club?.id);

    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<MonthlyContributionFilters>({
            defaultFilters: {
                search: "",
                period_id: undefined,
                user_id: undefined,
                status: undefined,
                paid_by: undefined,
                is_active: undefined,
            },
            defaultSortBy: "created_at",
            defaultSortDir: "desc",
        });

    // ── Draft state cho extra filters ─────────────────────────────────────────
    const [draftStatus, setDraftStatus] = useState<ContributionStatus | undefined>(params.status);
    const [draftPaidBy, setDraftPaidBy] = useState<ContributionPaidBy | undefined>(params.paid_by);
    const [draftIsActive, setDraftIsActive] = useState<0 | 1 | undefined>(params.is_active);

    useEffect(() => { setDraftStatus(params.status); }, [params.status]);
    useEffect(() => { setDraftPaidBy(params.paid_by); }, [params.paid_by]);
    useEffect(() => { setDraftIsActive(params.is_active); }, [params.is_active]);

    // ✅ Hook tự lấy clubSlug bên trong — gọi đơn giản như useUsers(params)
    const { data, total, isLoading, togglingIds, handleToggleStatus } =
        useMonthlyContributions(params);

    // ── FilterBar handlers ────────────────────────────────────────────────────
    const handleApplyFilters = (filters: AppliedFilters) => {
        updateMany({
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            status: draftStatus,
            paid_by: draftPaidBy,
            is_active: draftIsActive,
        });
    };

    const handleReset = () => {
        setDraftStatus(undefined);
        setDraftPaidBy(undefined);
        setDraftIsActive(undefined);
        reset();
    };

    // ── Sort options ──────────────────────────────────────────────────────────
    const sortOptions = [
        { value: "created_at", label: t("createdAt") },
        { value: "amount", label: tm("amount") },
        { value: "payment_date", label: tm("paymentDate") },
        { value: "sort_order", label: t("sortOrder") },
    ];

    // ── Extra filters ─────────────────────────────────────────────────────────
    const statusOptions = [
        { value: "pending", label: tm("status_pending") },
        { value: "paid", label: tm("status_paid") },
        { value: "cancelled", label: tm("status_cancelled") },
    ];

    const paidByOptions = [
        { value: "bank", label: tm("paid_by_bank") },
        { value: "cash", label: tm("paid_by_cash") },
        { value: "manual", label: tm("paid_by_manual") },
    ];

    const activeOptions = [
        { value: "1", label: t("active") },
        { value: "0", label: t("inactive") },
    ];

    const extraFilters = (
        <>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{tm("status")}</span>
                <Select
                    label={tm("status")}
                    options={statusOptions}
                    value={draftStatus ?? ""}
                    onChange={(v) => setDraftStatus(v === "" ? undefined : (v as ContributionStatus))}
                    placeholder={t("all")}
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{tm("paidBy")}</span>
                <Select
                    label={tm("paidBy")}
                    options={paidByOptions}
                    value={draftPaidBy ?? ""}
                    onChange={(v) => setDraftPaidBy(v === "" ? undefined : (v as ContributionPaidBy))}
                    placeholder={t("all")}
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{t("active")}</span>
                <Select
                    label={t("active")}
                    options={activeOptions}
                    value={draftIsActive !== undefined ? String(draftIsActive) : ""}
                    onChange={(v) =>
                        setDraftIsActive(v === "" ? undefined : (Number(v) as 0 | 1))
                    }
                    placeholder={t("all")}
                />
            </div>
        </>
    );

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnDef<MonthlyContribution>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => (
                <span className="text-foreground-muted text-xs">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "user",
            label: tm("member"),
            render: (row) => (
                <div>
                    <p className="text-sm font-medium text-foreground">{row.user?.fullname || "—"}</p>
                    <p className="text-xs text-foreground-muted">{row.user?.email || ""}</p>
                </div>
            ),
        },
        {
            key: "period",
            label: tm("period"),
            className: "w-32",
            render: (row) => (
                <span className="text-sm text-foreground">
                    {row.period
                        ? `${String(row.period.month).padStart(2, "0")}/${row.period.year}`
                        : "—"}
                </span>
            ),
        },
        {
            key: "amount",
            label: tm("amount"),
            className: "w-36 text-right",
            render: (row) => (
                <span className="text-sm font-medium text-foreground tabular-nums">
                    {formatAmount(row.amount)}
                </span>
            ),
        },
        {
            key: "status",
            label: tm("status"),
            className: "w-28 text-center",
            render: (row) => (
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[row.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                >
                    {tm(`status_${row.status}` as Parameters<typeof tm>[0])}
                </span>
            ),
        },
        {
            key: "paid_by",
            label: tm("paidBy"),
            className: "w-28 text-center",
            render: (row) =>
                row.paid_by ? (
                    <span className="text-xs text-foreground-muted">
                        {tm(`paid_by_${row.paid_by}` as Parameters<typeof tm>[0])}
                    </span>
                ) : (
                    <span className="text-xs text-foreground-muted">—</span>
                ),
        },
        {
            key: "payment_date",
            label: tm("paymentDate"),
            className: "w-40",
            render: (row) => (
                <span className="text-xs text-foreground-muted">
                    {formatDateTime(row.payment_date)}
                </span>
            ),
        },
        {
            key: "is_active",
            label: t("active"),
            className: "text-center w-24",
            render: (row) => (
                <div className="flex justify-center">
                    <ToggleSwitch
                        checked={Boolean(row.is_active)}
                        loading={togglingIds.has(row.id)}
                        disabled={!canUpdate}
                        onChange={() => canUpdate && handleToggleStatus(row)}
                    />
                </div>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{tm("title")}</h1>
                    <p className="text-sm text-foreground-muted mt-0.5">
                        {tm("totalCount", { count: total.toLocaleString() })}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <FilterBar
                    search={params.search}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={sortOptions}
                    showStatusFilter={false}
                    loading={isLoading}
                    onApply={handleApplyFilters}
                    onReset={handleReset}
                    extraFilters={extraFilters}
                />

                <Table
                    columns={columns}
                    data={data}
                    loading={isLoading}
                    keyExtractor={(row) => row.id}
                    emptyText={tm("notFound")}
                />

                <Pagination
                    page={params.page}
                    limit={params.limit}
                    total={total}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            </div>
        </div>
    );
}
