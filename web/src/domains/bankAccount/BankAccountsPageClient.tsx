"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";

import {
    Table,
    type ColumnDef,
} from "@/components/shared/ui/Table";

import {
    FilterBar,
    type AppliedFilters,
} from "@/components/shared/ui/FilterBar";

import { DataTable } from "@/components/shared/ui/DataTable";
import Select from "@/components/shared/ui/Select";

import {
    FormModalWithMedia,
    type FormFieldDef,
    type SubmitResult,
} from "@/components/shared/forms/FormModalWithMedia";

import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";

import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";

import { useListParams } from "@/hooks/useListParams";
import { useClub } from "@/domains/club/hooks/useClub";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { clubRoute } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";

import { useBankAccounts } from "@/domains/bankAccount/hooks/useBankAccounts";
import type {
    BankAccount,
    BankAccountFilters,
} from "@/domains/bankAccount/types";

import { formatDateTime } from "@/utils";
import CustomImage from "@/components/shared/media/CustomImage";

export function BankAccountsPageClient() {
    const t = useTranslations("common");
    const tb = useTranslations("bankAccount");

    const { club, slug } = useClub();
    const { hasPermission, isSuperAdmin } = useAuth();

    const canCreate =
        isSuperAdmin ||
        hasPermission(
            "bank_account",
            "create",
            club?.id
        );

    const canUpdate =
        isSuperAdmin ||
        hasPermission(
            "bank_account",
            "update",
            club?.id
        );

    const canDelete =
        isSuperAdmin ||
        hasPermission(
            "bank_account",
            "delete",
            club?.id
        );

    const {
        params,
        setPage,
        setLimit,
        updateMany,
        reset,
    } = useListParams<BankAccountFilters>({
        defaultFilters: {
            search: "",
            is_active: undefined,
        },
        defaultSortBy: "sort_order",
        defaultSortDir: "asc",
    });

    const [draftIsActive, setDraftIsActive] =
        useState<0 | 1 | undefined>(
            params.is_active
        );

    useEffect(() => {
        setDraftIsActive(params.is_active);
    }, [params.is_active]);

    const {
        data,
        total,
        isLoading,
        isFetching,
        isCreating,
        isUpdating,
        isDeleting,
        togglingStatusIds,
        togglingDefaultIds,
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleToggleStatus,
        handleToggleDefault,
        banks,
    } = useBankAccounts({ ...params, club_slug: slug });

    const [modalOpen, setModalOpen] =
        useState(false);

    const [selected, setSelected] =
        useState<BankAccount | null>(null);

    const [deleteTarget, setDeleteTarget] =
        useState<BankAccount | null>(null);

    const openCreate = () => {
        setSelected(null);
        setModalOpen(true);
    };

    const openEdit = (row: BankAccount) => {
        setSelected(row);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelected(null);
    };

    const handleSubmit = async (
        formData: FormData
    ): Promise<SubmitResult> => {
        const result = selected
            ? await handleEdit(
                selected.id,
                formData
            )
            : await handleCreate(formData);

        if (!result) {
            closeModal();
        }

        return result;
    };

    const handleApplyFilters = (
        filters: AppliedFilters
    ) => {
        updateMany({
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            is_active: draftIsActive,
        });
    };

    const handleReset = () => {
        setDraftIsActive(undefined);
        reset();
    };

    const sortOptions = [
        {
            value: "sort_order",
            label: t("sortOrder"),
        },
        {
            value: "created_at",
            label: t("createdAt"),
        },
    ];

    const activeOptions = [
        {
            value: "1",
            label: t("active"),
        },
        {
            value: "0",
            label: t("inactive"),
        },
    ];

    const extraFilters = (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-muted">
                {t("status")}
            </span>

            <Select
                label={t("status")}
                options={activeOptions}
                value={
                    draftIsActive !== undefined
                        ? String(draftIsActive)
                        : ""
                }
                onChange={(value) => {
                    setDraftIsActive(
                        value === ""
                            ? undefined
                            : (Number(value) as 0 | 1)
                    );
                }}
                placeholder={t("all")}
            />
        </div>
    );

    const formFields: FormFieldDef[] =
        useMemo(
            () => [
                {
                    name: "bank_id",
                    label: tb("bankName"),
                    type: "select",
                    required: true,
                    options: banks.map((bank) => ({ value: String(bank.id), label: bank.name })),
                    placeholder: tb("bankNamePlaceholder"),
                },
                {
                    name: "account_number",
                    label: tb("accountNumber"),
                    type: "text",
                    required: true,
                    placeholder: tb(
                        "accountNumberPlaceholder"
                    ),
                },
                {
                    name: "account_name",
                    label: tb("accountName"),
                    type: "text",
                    required: true,
                    placeholder: tb(
                        "accountNamePlaceholder"
                    ),
                },
                {
                    name: "sort_order",
                    label: t("sortOrder"),
                    type: "number",
                    placeholder: "0",
                },
                {
                    name: "is_active",
                    label: t("active"),
                    type: "toggle",
                },
                {
                    name: "is_default",
                    label: tb("isDefault"),
                    type: "toggle",
                },
            ],
            [banks, t, tb]
        );

    const initialValues = selected
        ? {
            bank_id: String(selected.bank_id),
            account_number:
                selected.account_number,
            account_name: selected.account_name,
            sort_order: String(
                selected.sort_order ?? 0
            ),
            is_active: selected.is_active
                ? "1"
                : "0",
            is_default: selected.is_default
                ? "1"
                : "0",
        }
        : {
            bank_id: "",
            account_number: "",
            account_name: "",
            sort_order: "0",
            is_active: "1",
            is_default: "0",
        };

    const imageFields = [
        {
            name: "qr_image",
            label: tb("qrImage"),
            initialUrl: selected?.qr_image ?? null,
            required: !selected,
        },
    ];

    const columns: ColumnDef<BankAccount>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => (
                <span className="text-xs text-foreground-muted">
                    {(params.page - 1) *
                        params.limit +
                        index +
                        1}
                </span>
            ),
        },
        {
            key: "bank",
            label: tb("bankName"),
            render: (row) => (
                <div className="flex items-center gap-3">
                    {row.bank?.logo && (
                        <CustomImage
                            src={row.bank.logo}
                            alt={row.bank.name}
                            className="h-9 w-9 rounded-lg border border-border object-contain"
                        />
                    )}
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {row.bank?.name || t("noData")}
                        </p>

                        {row.bank?.code && (
                            <p className="text-xs text-foreground-muted">
                                {row.bank.code}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "account_number",
            label: tb("accountNumber"),
            render: (row) => (
                <span className="text-sm tabular-nums text-foreground">
                    {row.account_number ||
                        t("noData")}
                </span>
            ),
        },
        {
            key: "account_name",
            label: tb("accountName"),
            render: (row) => (
                <span className="text-sm text-foreground">
                    {row.account_name ||
                        t("noData")}
                </span>
            ),
        },
        {
            key: "qr_image",
            label: tb("qrImage"),
            className: "w-20 text-center",
            render: (row) =>
                row.qr_image ? (
                    <a
                        href={row.qr_image}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex"
                    >
                        <CustomImage
                            src={row.qr_image}
                            alt={tb("qrImage")}
                            className="h-10 w-10 rounded-lg border border-border object-cover"
                        />
                    </a>
                ) : (
                    <span className="text-xs text-foreground-muted">
                        {t("noData")}
                    </span>
                ),
        },
        {
            key: "is_active",
            label: t("status"),
            className: "w-28 text-center",
            render: (row) => (
                <div className="flex justify-center">
                    <ToggleSwitch
                        checked={Boolean(
                            row.is_active
                        )}
                        loading={togglingStatusIds.has(row.id)}
                        disabled={!canUpdate}
                        onChange={() =>
                            handleToggleStatus(
                                row.id
                            )
                        }
                    />
                </div>
            ),
        },
        {
            key: "is_default",
            label: tb("isDefault"),
            className: "w-28 text-center",
            render: (row) => (
                <div className="flex justify-center">
                    <ToggleSwitch
                        checked={Boolean(
                            row.is_default
                        )}
                        loading={togglingDefaultIds.has(row.id)}
                        disabled={!canUpdate}
                        onChange={() =>
                            handleToggleDefault(
                                row.id
                            )
                        }
                    />
                </div>
            ),
        },
        {
            key: "created_at",
            label: t("createdAt"),
            className: "w-40",
            render: (row) => (
                <span className="text-xs text-foreground-muted">
                    {formatDateTime(
                        row.created_at
                    )}
                </span>
            ),
        },
    ];

    if (!club || !slug) return null;

    return (
        <div className="space-y-6">
            <Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">
                        {tb("title")}
                    </h1>

                    <p className="mt-0.5 text-sm text-foreground-muted">
                        {tb("totalCount", {
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
                        {tb("create")}
                    </button>
                )}
            </div>

            <FilterBar
                search={params.search ?? ""}
                sortBy={params.sort_by}
                sortDir={params.sort_dir}
                sortOptions={sortOptions}
                showStatusFilter={false}
                loading={isFetching}
                onApply={handleApplyFilters}
                onReset={handleReset}
                extraFilters={extraFilters}
                searchPlaceholder={tb("search")}
            />

            <DataTable
                table={{
                    columns,
                    data: data ?? [],

                    // Skeleton chỉ hiển thị ở lần load đầu
                    loading: isLoading,

                    // Overlay loading khi đổi filter/page/sort
                    fetching: isFetching,

                    keyExtractor: (row) => row.id,

                    showActions:
                        canUpdate || canDelete,

                    emptyText: tb("notFound"),

                    renderActions: (row) => (
                        <TableActions>
                            {canUpdate && (
                                <TableActionItem
                                    icon={
                                        <Pencil className="h-4 w-4" />
                                    }
                                    label={t("edit")}
                                    onClick={() =>
                                        openEdit(row)
                                    }
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
                    ),
                }}
                pagination={{
                    page: params.page,
                    limit: params.limit,
                    total,
                    onPageChange: setPage,
                    onLimitChange: setLimit,
                }}
            />


            <FormModalWithMedia
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={
                    selected
                        ? tb("edit")
                        : tb("create")
                }
                submitting={
                    selected
                        ? isUpdating
                        : isCreating
                }
                isEdit={Boolean(selected)}
                fields={formFields}
                initialValues={initialValues}
                imageFields={imageFields}
            />

            <DeleteConfirmModal
                isOpen={Boolean(deleteTarget)}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tb("deleteConfirmMsg", {
                            name:
                                deleteTarget.account_name,
                        })
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => {
                    if (!deleteTarget) {
                        return;
                    }

                    handleDeleteConfirm(
                        deleteTarget.id
                    );

                    setDeleteTarget(null);
                }}
                onCancel={() =>
                    setDeleteTarget(null)
                }
                loading={isDeleting}
            />
        </div>
    );
}
