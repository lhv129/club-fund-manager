"use client";

import { useState } from "react";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";

import { DataTable } from "@/components/shared/ui/DataTable";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";

import {
    FormModalWithMedia,
    toInitialTranslations,
} from "@/components/shared/forms/FormModalWithMedia";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";

import type { ColumnDef } from "@/components/shared/ui/Table";

import { useListParams } from "@/hooks/useListParams";
import { useClubsQuery } from "@/domains/club/hooks/useClubsQuery";
import type {
    Club,
    ClubFilters,
    Translation,
} from "@/domains/club/types";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { APP_ROUTES, clubDashboardRoute } from "@/constants";

export function ClubsAdminPageClient() {
    const router = useRouter();
    const locale = useLocale();

    const t = useTranslations("common");
    const tc = useTranslations("club");

    const tr = (translations?: Translation[]) => {
        return (
            translations?.find(
                (item) => item.locale === locale,
            ) ?? translations?.[0]
        );
    };

    const {
        params,
        setPage,
        setLimit,
        updateMany,
        reset,
    } = useListParams<ClubFilters>({
        defaultFilters: {
            search: "",
            is_active: undefined,
        },
        defaultSortBy: "sort_order",
        defaultSortDir: "asc",
        defaultLimit: 10,
    });

    const {
        data,
        total,
        isLoading,
        isFetching,
        togglingIds,
        isCreating,
        isUpdating,
        isDeleting,
        handleCreate,
        handleEdit,
        handleDeleteConfirm,
        handleToggle,
    } = useClubsQuery(params);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Club | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<Club | null>(null);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (row: Club) => {
        setEditing(row);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const openDelete = (row: Club) => {
        setDeleteTarget(row);
    };

    const handleDetail = (row: Club) => {
        const slug =
            tr(row.translations)?.slug ?? String(row.id);

        router.push(clubDashboardRoute(slug) as never);
    };

    const columns: ColumnDef<Club>[] = [
        {
            key: "stt",
            label: t("no"),
            className: "w-12",
            render: (_row, index) => {
                const number =
                    (params.page - 1) *
                    params.limit +
                    index +
                    1;

                return (
                    <span className="text-foreground-muted text-xs">
                        {number}
                    </span>
                );
            },
        },
        {
            key: "name",
            label: t("name"),
            render: (row) => {
                const translation = tr(
                    row.translations,
                );

                return (
                    <span className="text-sm font-medium text-foreground">
                        {translation?.name ?? "—"}
                    </span>
                );
            },
        },
        {
            key: "total_members",
            label: t("members"),
            render: (row) => {
                return (
                    <span className="text-sm text-foreground">
                        {row.total_members ?? 0}
                    </span>
                );
            },
        },
        {
            key: "is_active",
            label: t("status"),
            render: (row) => {
                const isToggling =
                    togglingIds.has(row.id);

                return (
                    <ToggleSwitch
                        checked={Boolean(row.is_active)}
                        loading={isToggling}
                        onChange={() => handleToggle(row)}
                    />
                );
            },
        },
    ];

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

    return (
        <div className="space-y-6">
            <Breadcrumb homeHref={APP_ROUTES.admin} />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">
                        {tc("title")}
                    </h1>

                    <p className="mt-0.5 text-sm text-foreground-muted">
                        {tc("totalCount", {
                            count: total.toLocaleString(),
                        })}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="
                        inline-flex items-center gap-2
                        rounded-xl bg-primary
                        px-3.5 py-2
                        text-sm font-medium
                        text-primary-foreground
                        shadow-sm shadow-primary/25
                        transition-all
                        hover:bg-primary-hover
                        active:scale-[0.98]
                    "
                >
                    <span className="text-base leading-none">
                        +
                    </span>

                    {tc("create")}
                </button>
            </div>

            <FilterBar
                search={params.search ?? ""}
                isActive={params.is_active}
                sortBy={params.sort_by}
                sortDir={params.sort_dir}
                sortOptions={sortOptions}
                loading={isFetching}
                onApply={(filters) =>
                    updateMany(
                        filters as Partial<typeof params>,
                    )
                }
                onReset={reset}
            />

            <DataTable
                table={{
                    columns,
                    data: data ?? [],

                    // Chỉ skeleton ở lần load đầu tiên
                    loading: isLoading,

                    // Hiển thị overlay khi đổi filter/page/sort
                    fetching: isFetching,

                    keyExtractor: (row) => row.id,
                    showActions: true,
                    emptyText: tc("notFound"),
                    renderActions: (row) => (
                        <TableActions>
                            <TableActionItem
                                icon={
                                    <ArrowRight className="h-4 w-4" />
                                }
                                label={t("openWorkspace")}
                                onClick={() =>
                                    handleDetail(row)
                                }
                            />

                            <TableActionItem
                                icon={
                                    <Pencil className="h-4 w-4" />
                                }
                                label={t("edit")}
                                onClick={() =>
                                    openEdit(row)
                                }
                            />

                            <TableActionItem
                                icon={
                                    <Trash2 className="h-4 w-4" />
                                }
                                label={t("delete")}
                                variant="danger"
                                onClick={() =>
                                    openDelete(row)
                                }
                            />
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
                onSubmit={async (formData) => {
                    const result = editing
                        ? await handleEdit(
                            editing.id,
                            formData,
                        )
                        : await handleCreate(formData);

                    if (!result) {
                        closeModal();
                    }

                    return result;
                }}
                title={
                    editing
                        ? tc("edit")
                        : tc("create")
                }
                isEdit={Boolean(editing)}
                submitting={
                    editing
                        ? isUpdating
                        : isCreating
                }
                fields={[
                    {
                        name: "max_members",
                        label: t("maxMembers"),
                        type: "number",
                        required: true,
                    },
                    {
                        name: "is_active",
                        label: t("active"),
                        type: "toggle",
                    },
                ]}
                initialValues={{
                    max_members: editing?.max_members ?? 50,
                    is_active: editing ? (editing.is_active ? "1" : "0") : "1",
                }}
                translatableFields={[
                    {
                        name: "name",
                        label: t("name"),
                        type: "text",
                        required: true,
                        placeholder: tc("namePlaceholder"),
                    },
                    {
                        name: "description",
                        label: t("description"),
                        type: "richtext",
                        placeholder: tc("descriptionPlaceholder"),
                    },
                ]}
                initialTranslations={toInitialTranslations(editing?.translations)}
                imageFields={[
                    {
                        name: "logo",
                        label: t("logo"),
                        initialUrl: editing?.logo ?? null,
                    },
                ]}
            />

            <DeleteConfirmModal
                isOpen={Boolean(deleteTarget)}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={
                    deleteTarget
                        ? tc("deleteConfirmMsg", {
                            name:
                                tr(
                                    deleteTarget.translations,
                                )?.name ??
                                String(
                                    deleteTarget.id,
                                ),
                        })
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                loading={isDeleting}
                onConfirm={() => {
                    if (!deleteTarget) {
                        return;
                    }

                    handleDeleteConfirm(
                        deleteTarget.id,
                    );

                    setDeleteTarget(null);
                }}
                onCancel={() =>
                    setDeleteTarget(null)
                }
            />
        </div>
    );
}
