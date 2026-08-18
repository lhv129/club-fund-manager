"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Table, type ColumnDef } from "@/components/shared/ui/Table";
import { DataTable } from "@/components/shared/ui/DataTable";
import {
    FormModal,
    type FormFieldDef,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";

import { useListParams } from "@/hooks/useListParams";
import { useExchangeSessionPlayers } from "./hooks/useExchangeSessionPlayers";
import type {
    ExchangeSessionPlayerFilters,
    ExchangeSessionPlayer,
} from "./types";
import { useClubMemberSelect } from "@/domains/members/hooks/useClubMembers";
import { formatAmount } from "@/utils";

export function ExchangeSessionPlayersPageClient() {
    const { slug, sessionId } = useParams<{
        slug: string;
        sessionId: string;
    }>();

    const t = useTranslations("common");
    const x = useTranslations("exchangeSession");

    const id = Number(sessionId);

    const {
        params,
        setPage,
        setLimit,
    } = useListParams<ExchangeSessionPlayerFilters>({
        defaultFilters: {
            paid: undefined,
        },
        defaultSortBy: "sort_order",
        defaultSortDir: "asc",
    });

    const players = useExchangeSessionPlayers({ ...params, club_slug: slug, exchange_session_id: id });
    const users = useClubMemberSelect({ club_slug: slug, status: 'approved' });

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] =
        useState<ExchangeSessionPlayer | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<ExchangeSessionPlayer | null>(null);

    const fields: FormFieldDef[] = useMemo(
        () => [
            {
                name: "user_id",
                label: x("user"),
                placeholder: x("placeholderUser"),
                type: "select",
                options: users.data.map((member) => ({
                    value: String(member.user_id),
                    label: member.user.fullname,
                })),
            },
            {
                name: "group_name",
                label: x("groupName"),
                type: "text",
            },
            {
                name: "male",
                label: x("male"),
                type: "number",
            },
            {
                name: "female",
                label: x("female"),
                type: "number",
            },
        ],
        [users.data, x]
    );

    const initialValues = selected
        ? {
            user_id: selected.user_id ? String(selected.user_id) : "",
            group_name: selected.group_name ?? "",
            male: String(selected.male),
            female: String(selected.female),
        }
        : {
            user_id: "",
            group_name: "",
            male: "0",
            female: "0",
        };

    const columns: ColumnDef<ExchangeSessionPlayer>[] = [
        {
            key: "index",
            label: x("stt"),
            className: "w-16 text-center",
            render: (_row, index) =>
                (params.page - 1) * params.limit + index + 1,
        },
        {
            key: "user",
            label: x("user"),
            render: (row) => row.user?.fullname || "—",
        },
        {
            key: "group_name",
            label: x("groupName"),
            render: (row) => row.group_name || "—",
        },
        {
            key: "male",
            label: x("male"),
            className: "text-center",
            render: (row) => row.male,
        },
        {
            key: "female",
            label: x("female"),
            className: "text-center",
            render: (row) => row.female,
        },
        {
            key: "amount",
            label: x("amount"),
            render: (row) => formatAmount(row.amount),
        },
        {
            key: "paid",
            label: x("paid"),
            render: (row) => (
                <ToggleSwitch
                    checked={row.paid}
                    loading={players.payingIds.has(row.id)}
                    onChange={() => players.handleTogglePaid(row)}
                />
            ),
        },
    ];

    const handleCreate = () => {
        setSelected(null);
        setIsOpen(true);
    };

    const handleEdit = (row: ExchangeSessionPlayer) => {
        setSelected(row);
        setIsOpen(true);
    };

    const handleCloseModal = () => {
        setIsOpen(false);
        setSelected(null);
    };

    const handleSubmit = async (values: Record<string, string>) => {
        const result = await (selected
            ? players.handleEdit(selected.id, values)
            : players.handleCreate(values));

        if (!result) {
            handleCloseModal();
        }

        return result;
    };

    const totalReceivable = players.data.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
    );
    const totalPaid = players.data.reduce(
        (sum, row) => sum + (row.paid ? Number(row.amount || 0) : 0),
        0
    );

    const handleDelete = () => {
        if (deleteTarget) {
            players.handleDelete(deleteTarget.id);
        }

        setDeleteTarget(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <h1 className="text-xl font-semibold">
                    {x("players")}
                </h1>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-primary-foreground"
                >
                    <Plus className="h-4 w-4" />
                    {t("create")}
                </button>
            </div>

            <DataTable
                table={{
                    columns,
                    data: players.data,
                    loading: players.isLoading,
                    fetching: players.isFetching,
                    keyExtractor: (row) => row.id,
                    emptyText: x("noPlayers"),
                    renderActions: (row) => (
                        <TableActions>
                            <TableActionItem
                                icon={<Pencil className="h-4 w-4" />}
                                label={t("edit")}
                                onClick={() => handleEdit(row)}
                            />

                            <TableActionItem
                                icon={<Trash2 className="h-4 w-4" />}
                                label={t("delete")}
                                variant="danger"
                                onClick={() => setDeleteTarget(row)}
                            />
                        </TableActions>
                    ),
                }}
                pagination={{
                    page: params.page,
                    limit: params.limit,
                    total: players.total,
                    onPageChange: setPage,
                    onLimitChange: setLimit,
                }}
            />

            <div className="flex flex-wrap justify-end gap-6 border-t border-border pt-4 text-sm">
                <div>
                    <span className="text-foreground-muted">{x("totalReceivable")}: </span>
                    <span className="font-semibold text-foreground">{formatAmount(totalReceivable)}</span>
                </div>
                <div>
                    <span className="text-foreground-muted">{x("totalPaid")}: </span>
                    <span className="font-semibold text-emerald-500">{formatAmount(totalPaid)}</span>
                </div>
            </div>

            <FormModal
                isOpen={isOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                title={selected ? x("editPlayer") : x("createPlayer")}
                fields={fields}
                initialValues={initialValues}
                isEdit={!!selected}
                submitting={
                    selected ? players.isUpdating : players.isCreating
                }
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={x("deletePlayerConfirm")}
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={players.isDeleting}
            />
        </div>
    );
}
