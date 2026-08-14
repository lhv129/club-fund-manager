"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArchiveRestore, LockKeyhole, Plus, Trash2, UnlockKeyhole } from "lucide-react";

import { type ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { DataTable } from "@/components/shared/ui/DataTable";
import {
    FormModal,
    type FormFieldDef,
    type TranslatableFieldDef,
    type TranslationEntry,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { Badge } from "@/components/shared/ui/Badge";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import Select from "@/components/shared/ui/Select";
import { useListParams } from "@/hooks/useListParams";
import { useClub } from "@/domains/club/hooks/useClub";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useFundPeriods } from "@/domains/fundPeriod/hooks/useFundPeriods";
import type { FundPeriod, FundPeriodFilters } from "@/domains/fundPeriod/types";
import { clubRoute } from "@/constants";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { getTranslatedTitle } from "@/lib/translations";
import { formatAmount } from "@/utils";
import {
    FundPeriodTabs,
    type FundPeriodView,
} from "@/domains/fundPeriod/components/FundPeriodTabs";

// ─── Constants ────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
    value: String(currentYear - 2 + i),
    label: String(currentYear - 2 + i),
}));

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function FundPeriodPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tf = useTranslations("fundPeriod");

    const { club, slug } = useClub();
    const { hasPermission, isSuperAdmin } = useAuth();

    const canCreate = isSuperAdmin || hasPermission("fund_period", "create", club?.id);
    const canDelete = isSuperAdmin || hasPermission("fund_period", "delete", club?.id);
    const canUpdate = isSuperAdmin || hasPermission("fund_period", "update", club?.id);

    // ── List params ───────────────────────────────────────────────────────────
    const { params, setPage, setLimit, updateMany, reset } =
        useListParams<FundPeriodFilters>({
            defaultFilters: { search: "", year: undefined, month: undefined },
            defaultSortBy: "year",
            defaultSortDir: "desc",
        });

    // ── Draft state cho extra filters (year/month) ────────────────────────────
    const [draftYear, setDraftYear] = useState<number | undefined>(params.year);
    const [draftMonth, setDraftMonth] = useState<number | undefined>(params.month);
    const [view, setView] = useState<FundPeriodView>("active");

    useEffect(() => { setDraftYear(params.year); }, [params.year]);
    useEffect(() => { setDraftMonth(params.month); }, [params.month]);

    // ── Data ──────────────────────────────────────────────────────────────────
    const {
        data,
        total,
        isLoading,
        isFetching,
        togglingIds,
        isCreating,
        isDeleting,
        trashedData,
        trashedTotal,
        isTrashedLoading,
        isTrashedFetching,
        isRestoring,
        isClosing,
        isReopening,
        handleCreate,
        handleDeleteConfirm,
        handleToggleStatus,
        handleRestore,
        handleClose,
        handleReopen,
    } = useFundPeriods({ ...params, club_slug: slug }, view);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<FundPeriod | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<FundPeriod | null>(null);
    const [closeTarget, setCloseTarget] = useState<FundPeriod | null>(null);
    const [reopenTarget, setReopenTarget] = useState<FundPeriod | null>(null);

    const openCreate = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    // ── FilterBar handlers ────────────────────────────────────────────────────
    const handleApplyFilters = (filters: AppliedFilters) => {
        updateMany({
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            year: draftYear,
            month: draftMonth,
        });
    };

    const handleReset = () => {
        setDraftYear(undefined);
        setDraftMonth(undefined);
        reset();
    };

    // ── Form submit ────────────────────────────────────────────────────────────
    const handleSubmit = async (
        values: Record<string, string>,
        translations?: TranslationEntry[]
    ) => {
        const result = await handleCreate(values, translations);
        if (!result) closeModal();
        return result;
    };

    // ── Form config ────────────────────────────────────────────────────────────
    const sortOptions = [
        { value: "year", label: tf("year") },
        { value: "month", label: tf("month") },
        { value: "created_at", label: t("createdAt") },
    ];

    const formFields: FormFieldDef[] = useMemo(
        () => [
            {
                name: "year",
                label: tf("year"),
                type: "select",
                required: true,
                options: YEAR_OPTIONS,
            },
            {
                name: "month",
                label: tf("month"),
                type: "select",
                required: true,
                options: MONTH_OPTIONS,
            },
            {
                name: "male_amount",
                label: tf("maleAmount"),
                type: "number",
                required: true,
                placeholder: "0",
            },
            {
                name: "female_amount",
                label: tf("femaleAmount"),
                type: "number",
                required: true,
                placeholder: "0",
            },
            {
                name: "exchange_male_amount",
                label: tf("exchangeMaleAmount"),
                type: "number",
                required: true,
                placeholder: "0",
            },
            {
                name: "exchange_female_amount",
                label: tf("exchangeFemaleAmount"),
                type: "number",
                required: true,
                placeholder: "0",
            },
            {
                name: "sort_order",
                label: t("sortOrder"),
                type: "number",
                placeholder: "1",
            },
            { name: "is_active", label: t("active"), type: "toggle" },
        ],
        [t, tf]
    );

    const translatableFields: TranslatableFieldDef[] = useMemo(
        () => [
            { name: "title", label: t("name"), type: "text", required: true },
            { name: "description", label: t("description"), type: "textarea" },
        ],
        [t]
    );

    const createInitialValues = {
        year: String(currentYear),
        month: String(new Date().getMonth() + 1),
        male_amount: "0",
        female_amount: "0",
        exchange_male_amount: "0",
        exchange_female_amount: "0",
        sort_order: "1",
        is_active: "1",
    };

    const reopenFields: FormFieldDef[] = [
        {
            name: "reason",
            label: tf("reopenReason"),
            type: "textarea",
            required: true,
            placeholder: tf("reopenReasonPlaceholder"),
        },
    ];

    // ── Extra filters JSX ─────────────────────────────────────────────────────
    const extraFilters = (
        <>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{tf("year")}</span>
                <Select
                    label={tf("year")}
                    options={YEAR_OPTIONS}
                    value={draftYear !== undefined ? String(draftYear) : ""}
                    onChange={(v) => setDraftYear(v === "" ? undefined : Number(v))}
                    placeholder={t("all")}
                />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">{tf("month")}</span>
                <Select
                    label={tf("month")}
                    options={MONTH_OPTIONS}
                    value={draftMonth !== undefined ? String(draftMonth) : ""}
                    onChange={(v) => setDraftMonth(v === "" ? undefined : Number(v))}
                    placeholder={t("all")}
                />
            </div>
        </>
    );

    // ── Columns ────────────────────────────────────────────────────────────────
    const columns: ColumnDef<FundPeriod>[] = [
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
            key: "title",
            label: t("name"),
            render: (row) => (
                <span className="text-sm text-foreground font-medium">
                    {/* getTranslatedTitle — Translation đã có title?: string */}
                    {getTranslatedTitle(row.translations, locale) || "—"}
                </span>
            ),
        },
        {
            key: "period",
            label: tf("period"),
            render: (row) => (
                <span className="text-sm text-foreground whitespace-nowrap">
                    {tf("periodValue", { month: row.month, year: row.year })}
                </span>
            ),
        },
        {
            key: "male_amount",
            label: tf("maleAmount"),
            render: (row) => (
                <span className="text-sm text-foreground tabular-nums">
                    {formatAmount(row.male_amount)}
                </span>
            ),
        },
        {
            key: "female_amount",
            label: tf("femaleAmount"),
            render: (row) => (
                <span className="text-sm text-foreground tabular-nums">
                    {formatAmount(row.female_amount)}
                </span>
            ),
        },
        {
            key: "exchange_male_amount",
            label: tf("exchangeMaleAmount"),
            render: (row) => (
                <span className="text-sm text-foreground tabular-nums">
                    {formatAmount(row.exchange_male_amount)}
                </span>
            ),
        },
        {
            key: "exchange_female_amount",
            label: tf("exchangeFemaleAmount"),
            render: (row) => (
                <span className="text-sm text-foreground tabular-nums">
                    {formatAmount(row.exchange_female_amount)}
                </span>
            ),
        },
        {
            key: "is_locked",
            label: tf("isLocked"),
            className: "text-center w-24",
            render: (row) => (
                <Badge
                    variant={row.is_locked ? "inactive" : "active"}
                    title={row.is_locked ? tf("locked") : tf("unlocked")}
                    showDot={false}
                />
            ),
        },
        {
            key: "is_active",
            label: t("isActive"),
            className: "text-center w-24",
            render: (row) => (
                <div className="flex justify-center">
                    <ToggleSwitch
                        checked={Boolean(row.is_active)}
                        loading={togglingIds.has(row.id)}
                        onChange={() => canUpdate && handleToggleStatus(row)}
                        disabled={!canUpdate || row.is_locked}
                    />
                </div>
            ),
        },
    ];

    if (!club || !slug) return null;

    const displayedData = view === "active" ? data : trashedData;
    const displayedTotal = view === "active" ? total : trashedTotal;
    const displayedLoading = view === "active" ? isLoading : isTrashedLoading;
    const displayedFetching = view === "active" ? isFetching : isTrashedFetching;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-foreground">{tf("title")}</h1>
                    <p className="mt-1 text-sm text-foreground-muted">
                        {tf("totalCount", { count: displayedTotal.toLocaleString() })}
                    </p>
                </div>
                {canCreate && (
                    <button
                        type="button"
                        onClick={openCreate}
                        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
                    >
                        <Plus className="w-4 h-4" />
                        {tf("create")}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <FundPeriodTabs
                    value={view}
                    activeLabel={tf("activeTab")}
                    trashedLabel={tf("trashedTab")}
                    onChange={(nextView) => {
                        setView(nextView);
                        setPage(1);
                    }}
                />

                <FilterBar
                    search={params.search}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={sortOptions}
                    showStatusFilter={false}
                    loading={displayedFetching}
                    onApply={handleApplyFilters}
                    onReset={handleReset}
                    extraFilters={extraFilters}
                />

                <DataTable
                    table={{ columns, data: displayedData, loading: displayedLoading, fetching: displayedFetching,
                    keyExtractor: (row) => row.id,
                    showActions: view === "trashed" ? canUpdate : canDelete || canUpdate,
                    renderActions: (row) => {
                        if (view === "trashed") {
                            if (!canUpdate) return null;
                            return (
                                <TableActions>
                                    <TableActionItem
                                        icon={<ArchiveRestore className="h-4 w-4" />}
                                        label={tf("restore")}
                                        variant="success"
                                        onClick={() => setRestoreTarget(row)}
                                    />
                                </TableActions>
                            );
                        }
                        if (!canDelete && !canUpdate) return null;
                        return (
                            <TableActions>
                                {canUpdate && (row.is_locked ? (
                                    <TableActionItem
                                        icon={<UnlockKeyhole className="h-4 w-4" />}
                                        label={tf("reopen")}
                                        onClick={() => setReopenTarget(row)}
                                    />
                                ) : (
                                    <TableActionItem
                                        icon={<LockKeyhole className="h-4 w-4" />}
                                        label={tf("closePeriod")}
                                        onClick={() => setCloseTarget(row)}
                                    />
                                ))}
                                {canDelete && !row.is_locked && (
                                    <TableActionItem
                                        icon={<Trash2 className="w-4 h-4" />}
                                        label={t("delete")}
                                        variant="danger"
                                        onClick={() => setDeleteTarget(row)}
                                    />
                                )}
                            </TableActions>
                        );
                    }, emptyText: tf("notFound") }}
                    pagination={{ page: params.page, limit: params.limit, total: displayedTotal, onPageChange: setPage, onLimitChange: setLimit }}
                />
            </div>

            <FormModal
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={tf("create")}
                submitting={isCreating}
                isEdit={false}
                fields={formFields}
                translatableFields={translatableFields}
                initialValues={createInitialValues}
                initialTranslations={{
                    vi: { locale: "vi", name: "", title: "", description: "" },
                    en: { locale: "en", name: "", title: "", description: "" },
                }}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tf("deleteConfirmMsg", {
                            title:
                                getTranslatedTitle(deleteTarget.translations, locale) ||
                                `${deleteTarget.month}/${deleteTarget.year}`,
                        })
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => {
                    if (deleteTarget) {
                        handleDeleteConfirm(deleteTarget.id);
                        setDeleteTarget(null);
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />

            <DeleteConfirmModal
                isOpen={!!closeTarget}
                title={tf("closeConfirmTitle")}
                description={tf("closeConfirmDescription")}
                message={closeTarget ? tf("closeConfirmMessage", { title: getTranslatedTitle(closeTarget.translations, locale) || `${closeTarget.month}/${closeTarget.year}` }) : ""}
                confirmText={tf("closePeriod")}
                cancelText={t("cancel")}
                onConfirm={async () => {
                    if (!closeTarget) return;
                    await handleClose(closeTarget.id);
                    setCloseTarget(null);
                }}
                onCancel={() => setCloseTarget(null)}
                loading={isClosing}
            />

            <DeleteConfirmModal
                isOpen={!!restoreTarget}
                title={tf("restoreConfirmTitle")}
                description={tf("restoreConfirmDescription")}
                message={restoreTarget ? tf("restoreConfirmMessage", { title: getTranslatedTitle(restoreTarget.translations, locale) || `${restoreTarget.month}/${restoreTarget.year}` }) : ""}
                confirmText={tf("restore")}
                cancelText={t("cancel")}
                onConfirm={async () => {
                    if (!restoreTarget) return;
                    await handleRestore(restoreTarget.id);
                    setRestoreTarget(null);
                }}
                onCancel={() => setRestoreTarget(null)}
                loading={isRestoring}
            />

            <FormModal
                isOpen={!!reopenTarget}
                onClose={() => setReopenTarget(null)}
                onSubmit={async (values) => {
                    if (!reopenTarget) return { success: false };
                    const reason = values.reason.trim();
                    if (!reason) {
                        return { success: false, errors: { reason: [tf("reopenReasonRequired")] } };
                    }
                    await handleReopen(reopenTarget.id, reason);
                    setReopenTarget(null);
                }}
                title={tf("reopenTitle")}
                fields={reopenFields}
                initialValues={{ reason: "" }}
                isEdit
                submitLabel={tf("reopen")}
                submitting={isReopening}
            />
        </div>
    );
}
