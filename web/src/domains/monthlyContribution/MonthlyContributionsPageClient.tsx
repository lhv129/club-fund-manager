// src/domains/monthlyContribution/MonthlyContributionsPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { ColumnDef } from "@/components/shared/ui/Table";
import {
    FilterBar,
    type AppliedFilters,
} from "@/components/shared/ui/FilterBar";
import { DataTable } from "@/components/shared/ui/DataTable";
import Select from "@/components/shared/ui/Select";
import {
    FormModal,
    type FormFieldDef,
    type SubmitResult,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";

import { Eye, Loader2, Pencil, Plus, QrCode, Trash2 } from "lucide-react";

import { useListParams } from "@/hooks/useListParams";
import { useClub } from "@/domains/club/hooks/useClub";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";

import { useFundPeriodSelect } from "@/domains/fundPeriod/hooks/useFundPeriods";
import { useClubMemberSelect } from "@/domains/members/hooks/useClubMembers";

import {
    useMonthlyContributionPaymentQr,
    useMonthlyContributions,
} from "@/domains/monthlyContribution/hooks/useMonthlyContributions";
import { PaymentQrModal } from "@/domains/monthlyContribution/components/PaymentQrModal";
import type {
    ContributionPaidBy,
    ContributionStatus,
    MonthlyContribution,
    MonthlyContributionFilters,
} from "@/domains/monthlyContribution/types";

import { formatAmount, formatDateTime } from "@/utils";

const STATUS_CLASSES: Record<ContributionStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-600",
};

export function MonthlyContributionsPageClient() {
    const t = useTranslations("common");
    const tm = useTranslations("monthlyContribution");
    const router = useRouter();

    const { club, slug } = useClub();
    const { user, hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();

    const canCreate =
        isSuperAdmin ||
        hasPermission(
            "monthly_contribution",
            "create",
            club?.id
        );

    const canUpdate =
        isSuperAdmin ||
        hasPermission(
            "monthly_contribution",
            "update",
            club?.id
        );

    const canDelete =
        isSuperAdmin ||
        hasPermission(
            "monthly_contribution",
            "delete",
            club?.id
        );




    const canGetPaymentQr = (row: MonthlyContribution) => {
        // Payment QR access rules:
        // 1. SuperAdmin                  → tất cả thành viên.
        // 2. System-level VIEW           → tất cả thành viên.
        // 3. Club-level VIEW             → tất cả thành viên trong club.
        // 4. Club-level CREATE           → chỉ contribution của chính mình.
        //
        // Backend vẫn phải enforce authorization.
        // Logic này chỉ dùng để quyết định có hiển thị action trên UI hay không.

        if (isSuperAdmin) {
            return true;
        }

        if (hasPermission("member_payment_code", "view")) {
            return true;
        }

        if (
            hasPermission(
                "member_payment_code",
                "view",
                club?.id
            )
        ) {
            return true;
        }

        return (
            row.user_id === user?.id &&
            hasPermission(
                "member_payment_code",
                "create",
                club?.id
            )
        );
    };

    const {
        params,
        setPage,
        setLimit,
        updateMany,
        reset,
    } = useListParams<MonthlyContributionFilters>({
        defaultFilters: {
            search: "",
            period_id: undefined,
            user_id: undefined,
            status: undefined,
            paid_by: undefined,
        },
        defaultSortBy: "created_at",
        defaultSortDir: "desc",
    });

    const [draftPeriodId, setDraftPeriodId] = useState<
        number | undefined
    >(params.period_id);

    const [draftUserId, setDraftUserId] = useState<
        number | undefined
    >(params.user_id);

    const [draftStatus, setDraftStatus] = useState<
        ContributionStatus | undefined
    >(params.status);

    const [draftPaidBy, setDraftPaidBy] = useState<
        ContributionPaidBy | undefined
    >(params.paid_by);

    useEffect(() => {
        setDraftPeriodId(params.period_id);
    }, [params.period_id]);

    useEffect(() => {
        setDraftUserId(params.user_id);
    }, [params.user_id]);

    useEffect(() => {
        setDraftStatus(params.status);
    }, [params.status]);

    useEffect(() => {
        setDraftPaidBy(params.paid_by);
    }, [params.paid_by]);

    const {
        data,
        total,
        isLoading,
        isFetching,
        isCreating,
        isUpdating,
        isDeleting,
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
    } = useMonthlyContributions({ ...params, club_slug: slug });

    const {
        qrUrl,
        isGettingPaymentQr,
        gettingPaymentQrId,
        handleGetPaymentQr,
        closePaymentQrModal,
    } = useMonthlyContributionPaymentQr(slug);

    const {
        data: fundPeriods,
        isLoading: isFundPeriodsLoading,
    } = useFundPeriodSelect({ club_slug: slug });

    const {
        data: members,
        isLoading: isMembersLoading,
    } = useClubMemberSelect({ club_slug: slug, status: "approved" });

    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] =
        useState<MonthlyContribution | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<MonthlyContribution | null>(null);

    const openCreate = () => {
        setSelected(null);
        setModalOpen(true);
    };

    const openEdit = (row: MonthlyContribution) => {
        setSelected(row);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelected(null);
    };

    const handleSubmit = async (
        values: Record<string, string>
    ): Promise<SubmitResult> => {
        const result = selected
            ? await handleEdit(selected.id, values)
            : await handleCreate(values);

        if (!result) {
            closeModal();
        }

        return result;
    };

    const handleApplyFilters = (filters: AppliedFilters) => {
        updateMany({
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            period_id: draftPeriodId,
            user_id: draftUserId,
            status: draftStatus,
            paid_by: draftPaidBy,
        });
    };

    const handleReset = () => {
        setDraftPeriodId(undefined);
        setDraftUserId(undefined);
        setDraftStatus(undefined);
        setDraftPaidBy(undefined);
        reset();
    };

    const periodOptions = fundPeriods.map((period) => ({
        value: String(period.id),
        label: `${String(period.month).padStart(2, "0")}/${period.year}`,
    }));

    const memberOptions = members.map((member) => ({
        value: String(member?.user_id),
        label: member.user?.fullname
            ? `${member.user.fullname} — ${member.user.email}`
            : String(member?.user_id),
    }));

    const sortOptions = [
        {
            value: "created_at",
            label: t("createdAt"),
        },
        {
            value: "amount",
            label: tm("amount"),
        },
        {
            value: "payment_date",
            label: tm("paymentDate"),
        },
        {
            value: "sort_order",
            label: t("sortOrder"),
        },
    ];

    const statusOptions = [
        {
            value: "pending",
            label: tm("status_pending"),
        },
        {
            value: "paid",
            label: tm("status_paid"),
        },
        {
            value: "cancelled",
            label: tm("status_cancelled"),
        },
    ];

    const paidByOptions = [
        {
            value: "bank",
            label: tm("paid_by_bank"),
        },
        {
            value: "cash",
            label: tm("paid_by_cash"),
        },
    ];

    const cashPaidByOptions = [
        {
            value: "cash",
            label: tm("paid_by_cash"),
        },
    ];

    const extraFilters = (
        <>
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground-muted">
                    {tm("member")}
                </span>

                <Select
                    label={tm("member")}
                    options={memberOptions}
                    value={
                        draftUserId !== undefined
                            ? String(draftUserId)
                            : ""
                    }
                    onChange={(value) => {
                        setDraftUserId(
                            value === "" ? undefined : Number(value)
                        );
                    }}
                    placeholder={t("all")}
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground-muted">
                    {tm("period")}
                </span>

                <Select
                    label={tm("period")}
                    options={periodOptions}
                    value={
                        draftPeriodId !== undefined
                            ? String(draftPeriodId)
                            : ""
                    }
                    onChange={(value) => {
                        setDraftPeriodId(
                            value === "" ? undefined : Number(value)
                        );
                    }}
                    placeholder={t("all")}
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground-muted">
                    {tm("status")}
                </span>

                <Select
                    label={tm("status")}
                    options={statusOptions}
                    value={draftStatus ?? ""}
                    onChange={(value) => {
                        setDraftStatus(
                            value === ""
                                ? undefined
                                : (value as ContributionStatus)
                        );
                    }}
                    placeholder={t("all")}
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground-muted">
                    {tm("paidBy")}
                </span>

                <Select
                    label={tm("paidBy")}
                    options={paidByOptions}
                    value={draftPaidBy ?? ""}
                    onChange={(value) => {
                        setDraftPaidBy(
                            value === ""
                                ? undefined
                                : (value as ContributionPaidBy)
                        );
                    }}
                    placeholder={t("all")}
                />
            </div>
        </>
    );

    const formFields: FormFieldDef[] = useMemo(
        () => [
            {
                name: "user_id",
                label: tm("member"),
                type: "select",
                required: true,
                options: memberOptions,
                placeholder: t("chooseOption"),
            },
            {
                name: "period_id",
                label: tm("period"),
                type: "select",
                required: true,
                options: periodOptions,
                placeholder: t("chooseOption"),
            },
            {
                name: "status",
                label: tm("status"),
                type: "select",
                required: true,
                options: statusOptions,
                placeholder: t("chooseOption"),
            },
            {
                name: "paid_by",
                label: tm("paidBy"),
                type: "select",
                options: cashPaidByOptions,
                placeholder: t("chooseOption"),
            },
            {
                name: "payment_date",
                label: tm("paymentDate"),
                type: "datetime-local",
            },
        ],
        [
            memberOptions,
            periodOptions,
            statusOptions,
            cashPaidByOptions,
            t,
            tm,
        ]
    );

    const initialValues = selected
        ? {
            user_id: String(selected.user_id),
            period_id: String(selected.period_id),
            status: selected.status,
            paid_by: selected.paid_by === "cash" ? "cash" : "",
            payment_date: selected.payment_date
                ? selected.payment_date.slice(0, 16)
                : "",
        }
        : {
            user_id: "",
            period_id: "",
            status: "pending",
            paid_by: "",
            payment_date: "",
        };

    const columns: ColumnDef<MonthlyContribution>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => (
                <span className="text-xs text-foreground-muted">
                    {(params.page - 1) * params.limit + index + 1}
                </span>
            ),
        },
        {
            key: "user",
            label: tm("member"),
            render: (row) => (
                <div>
                    <p className="text-sm font-medium text-foreground">
                        {row.user?.fullname || "—"}
                    </p>

                    <p className="text-xs text-foreground-muted">
                        {row.user?.email || ""}
                    </p>
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
                <span className="text-sm font-medium tabular-nums text-foreground">
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
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[row.status] ??
                        "bg-background-muted text-foreground-muted"
                        }`}
                >
                    {tm(
                        `status_${row.status}` as Parameters<
                            typeof tm
                        >[0]
                    )}
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
                        {tm(
                            `paid_by_${row.paid_by}` as Parameters<
                                typeof tm
                            >[0]
                        )}
                    </span>
                ) : (
                    <span className="text-xs text-foreground-muted">
                        —
                    </span>
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
    ];

    if (!club || !slug) return null;

    return (
        <>
            <div className="space-y-6">
                <Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            {tm("title")}
                        </h1>

                        <p className="mt-0.5 text-sm text-foreground-muted">
                            {tm("totalCount", {
                                count: total.toLocaleString(),
                            })}
                        </p>
                    </div>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="h-4 w-4" />
                            {t("create")}
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <FilterBar
                        search={params.search}
                        sortBy={params.sort_by}
                        sortDir={params.sort_dir}
                        sortOptions={sortOptions}
                        showStatusFilter={false}
                        loading={
                            isLoading ||
                            isMembersLoading ||
                            isFundPeriodsLoading
                        }
                        onApply={handleApplyFilters}
                        onReset={handleReset}
                        extraFilters={extraFilters}
                    />

                    <DataTable
                        table={{
                            columns, data, loading: isLoading, fetching: isFetching,
                            keyExtractor: (row) => row.id,
                            renderActions: (row) => (
                                <TableActions>
                                    <TableActionItem
                                        icon={<Eye className="h-4 w-4" />}
                                        label={t("view")}
                                        onClick={() => router.push(`${clubRoute(slug, CLUB_SUBROUTES.monthlyContributions)}/${row.id}` as never)}
                                    />
                                    {canGetPaymentQr(row) && (
                                        <TableActionItem
                                            icon={
                                                isGettingPaymentQr &&
                                                    gettingPaymentQrId === row.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <QrCode className="h-4 w-4" />
                                                )
                                            }
                                            label={tm("getPaymentQr")}
                                            variant="success"
                                            onClick={() => {
                                                void handleGetPaymentQr(row.id);
                                            }}
                                        />
                                    )}
                                    {canUpdate && (
                                        <TableActionItem
                                            icon={
                                                <Pencil className="h-4 w-4" />
                                            }
                                            label={t("edit")}
                                            onClick={() => openEdit(row)}
                                        />
                                    )}

                                    {canDelete && (
                                        <TableActionItem
                                            icon={
                                                <Trash2 className="h-4 w-4" />
                                            }
                                            label={t("delete")}
                                            variant="danger"
                                            onClick={() =>
                                                setDeleteTarget(row)
                                            }
                                        />
                                    )}
                                </TableActions>
                            ), emptyText: tm("notFound")
                        }}
                        pagination={{ page: params.page, limit: params.limit, total, onPageChange: setPage, onLimitChange: setLimit }}
                    />
                </div>
            </div>

            <FormModal
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selected ? t("edit") : t("create")}
                submitting={selected ? isUpdating : isCreating}
                isEdit={!!selected}
                fields={formFields}
                initialValues={initialValues}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={t("deleteConfirmMessage")}
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => {
                    if (!deleteTarget) return;

                    handleDeleteConfirm(deleteTarget.id);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
                loading={isDeleting}
            />

            <PaymentQrModal
                qrUrl={qrUrl}
                alt={tm("paymentQrAlt")}
                closeLabel={t("close")}
                onClose={closePaymentQrModal}
            />
        </>
    );
}
