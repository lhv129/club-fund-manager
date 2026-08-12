"use client";

import { useMemo, useState } from "react";
import {
    useLocale,
    useTranslations,
} from "next-intl";
import {
    CheckCircle2,
    Pencil,
    Plus,
    Trash2,
    Users,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";

import {
    Table,
    type ColumnDef,
} from "@/components/shared/ui/Table";
import { FilterBar } from "@/components/shared/ui/FilterBar";
import {
    FormModal,
    type FormFieldDef,
    type TranslatableFieldDef,
    type TranslationEntry,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { Badge } from "@/components/shared/ui/Badge";
import Select from "@/components/shared/ui/Select";

import { useListParams } from "@/hooks/useListParams";
import { useClub } from "@/domains/club/hooks/useClub";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { usePlayingScheduleSelect } from "@/domains/playingSchedule/hooks/usePlayingSchedules";

import { useExchangeSessions } from "./hooks/useExchangeSessions";
import type {
    ExchangeSession,
    ExchangeSessionFilters,
} from "./types";

import { getTranslatedTitle } from "@/lib/translations";
import { DataTable } from "@/components/shared/ui/DataTable";

export function ExchangeSessionsPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const x = useTranslations("exchangeSession");

    const { slug, club } = useClub();
    const { hasPermission, isSuperAdmin } = useAuth();
    const router = useRouter();

    const canCreate =
        isSuperAdmin ||
        hasPermission(
            "exchange_session",
            "create",
            club?.id,
        );

    const canUpdate =
        isSuperAdmin ||
        hasPermission(
            "exchange_session",
            "update",
            club?.id,
        );

    const canDelete =
        isSuperAdmin ||
        hasPermission(
            "exchange_session",
            "delete",
            club?.id,
        );

    const {
        params,
        setPage,
        setLimit,
        updateMany,
        reset,
    } = useListParams<ExchangeSessionFilters>({
        defaultFilters: {
            search: "",
            type: undefined,
            status: undefined,
        },
        defaultSortBy: "session_date",
        defaultSortDir: "asc",
    });

    const h = useExchangeSessions({
        ...params,
        club_slug: slug,
    });

    const ps = usePlayingScheduleSelect({
        club_slug: slug,
    });

    const [open, setOpen] = useState(false);

    const [selected, setSelected] =
        useState<ExchangeSession | null>(null);

    const [del, setDel] =
        useState<ExchangeSession | null>(null);

    const [draftType, setDraftType] =
        useState<ExchangeSessionFilters["type"]>(
            params.type,
        );

    const [draftStatus, setDraftStatus] =
        useState<ExchangeSessionFilters["status"]>(
            params.status,
        );

    const close = () => {
        setOpen(false);
        setSelected(null);
    };

    const fields: FormFieldDef[] = useMemo(
        () => [
            {
                name: "playing_schedule_id",
                label: x("schedule"),
                type: "select",
                options: ps.data.map((v) => ({
                    value: String(v.id),
                    label:
                        getTranslatedTitle(
                            v.translations,
                            locale,
                        ) || v.court_name,
                })),
            },
            {
                name: "session_date",
                label: x("sessionDate"),
                type: "datepicker",
                required: true,
            },
            {
                name: "court_name",
                label: x("courtName"),
                type: "text",
                required: true,
            },
            {
                name: "court_address",
                label: x("courtAddress"),
                type: "text",
            },
            {
                name: "start_time",
                label: x("startTime"),
                type: "time-select",
                required: true,
            },
            {
                name: "end_time",
                label: x("endTime"),
                type: "time-select",
                required: true,
            },
            {
                name: "type",
                label: x("type"),
                type: "select",
                required: true,
                options: [
                    {
                        value: "scheduled",
                        label: x("scheduled"),
                    },
                    {
                        value: "manual",
                        label: x("manual"),
                    },
                ],
            },
            {
                name: "status",
                label: t("status"),
                type: "select",
                required: true,
                options: [
                    {
                        value: "upcoming",
                        label: x("upcoming"),
                    },
                    {
                        value: "completed",
                        label: x("completed"),
                    },
                    {
                        value: "cancelled",
                        label: x("cancelled"),
                    },
                ],
            },
            {
                name: "sort_order",
                label: t("sortOrder"),
                type: "number",
            },
        ],
        [
            locale,
            ps.data,
            t,
            x,
        ],
    );

    const tf: TranslatableFieldDef[] = [
        {
            name: "title",
            label: x("titleField"),
            type: "text",
            required: true,
        },
        {
            name: "note",
            label: x("note"),
            type: "textarea",
        },
    ];

    const init = selected
        ? {
            playing_schedule_id:
                selected.playing_schedule_id
                    ? String(
                        selected.playing_schedule_id,
                    )
                    : "",
            session_date:
                selected.session_date,
            court_name:
                selected.court_name,
            court_address:
                selected.court_address ?? "",
            start_time:
                selected.start_time,
            end_time:
                selected.end_time,
            type: selected.type,
            status: selected.status,
            sort_order: String(
                selected.sort_order,
            ),
        }
        : {
            playing_schedule_id: "",
            session_date: "",
            court_name: "",
            court_address: "",
            start_time: "18:00",
            end_time: "20:00",
            type: "manual",
            status: "upcoming",
            sort_order: "1",
        };

    const tr = selected
        ? Object.fromEntries(
            (selected.translations ?? []).map(
                (v) => [
                    v.locale,
                    { ...v },
                ],
            ),
        )
        : {
            vi: {
                locale: "vi",
                title: "",
                note: "",
            },
            en: {
                locale: "en",
                title: "",
                note: "",
            },
        };

    const cols: ColumnDef<ExchangeSession>[] = [
        {
            key: "date",
            label: x("sessionDate"),
            render: (row) =>
                row.session_date,
        },
        {
            key: "title",
            label: x("titleField"),
            render: (row) =>
                getTranslatedTitle(
                    row.translations,
                    locale,
                ) || row.court_name,
        },
        {
            key: "court",
            label: x("courtName"),
            render: (row) => (
                <div>
                    {row.court_name}

                    <p className="text-xs text-foreground-muted">
                        {row.start_time} -{" "}
                        {row.end_time}
                    </p>
                </div>
            ),
        },
        {
            key: "type",
            label: x("type"),
            render: (row) => (
                <Badge
                    variant={row.type}
                    title={x(row.type)}
                    showDot={false}
                />
            ),
        },
        {
            key: "status",
            label: t("status"),
            render: (row) => (
                <Badge
                    variant={row.status}
                    title={x(row.status)}
                />
            ),
        },
        {
            key: "players",
            label: x("players"),
            render: (row) =>
                row.player_count,
        },
    ];

    if (!club || !slug) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-foreground">
                        {x("title")}
                    </h1>

                    <p className="mt-0.5 text-sm text-foreground-muted">
                        {x("totalCount", {
                            count: h.total,
                        })}
                    </p>
                </div>

                {canCreate && (
                    <button
                        type="button"
                        onClick={() =>
                            setOpen(true)
                        }
                        className="
                            inline-flex
                            shrink-0
                            items-center
                            gap-2
                            rounded-xl
                            bg-primary
                            px-3.5
                            py-2
                            text-sm
                            font-medium
                            text-primary-foreground
                            transition-colors
                            hover:bg-primary-hover
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-primary/40
                        "
                    >
                        <Plus className="h-3.5 w-3.5" />

                        {x("create")}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="mb-6">
                <FilterBar
                    search={params.search}
                    sortBy={params.sort_by}
                    sortDir={params.sort_dir}
                    sortOptions={[
                        {
                            value: "session_date",
                            label: x("sessionDate"),
                        },
                        {
                            value: "status",
                            label: t("status"),
                        },
                        {
                            value: "created_at",
                            label: t("createdAt"),
                        },
                    ]}
                    loading={h.isFetching}
                    showStatusFilter={false}
                    extraFilters={(
                        <>
                            <Select
                                label={x("type")}
                                options={[
                                    {
                                        value: "scheduled",
                                        label: x(
                                            "scheduled",
                                        ),
                                    },
                                    {
                                        value: "manual",
                                        label: x(
                                            "manual",
                                        ),
                                    },
                                ]}
                                value={
                                    draftType ?? ""
                                }
                                onChange={(value) =>
                                    setDraftType(
                                        (value ||
                                            undefined) as ExchangeSessionFilters["type"],
                                    )
                                }
                                placeholder={t(
                                    "all",
                                )}
                            />

                            <Select
                                label={t(
                                    "status",
                                )}
                                options={[
                                    {
                                        value: "upcoming",
                                        label: x(
                                            "upcoming",
                                        ),
                                    },
                                    {
                                        value: "completed",
                                        label: x(
                                            "completed",
                                        ),
                                    },
                                    {
                                        value: "cancelled",
                                        label: x(
                                            "cancelled",
                                        ),
                                    },
                                ]}
                                value={
                                    draftStatus ??
                                    ""
                                }
                                onChange={(value) =>
                                    setDraftStatus(
                                        (value ||
                                            undefined) as ExchangeSessionFilters["status"],
                                    )
                                }
                                placeholder={t(
                                    "all",
                                )}
                            />
                        </>
                    )}
                    onApply={(filters) =>
                        updateMany({
                            ...filters,
                            type: draftType,
                            status: draftStatus,
                        })
                    }
                    onReset={() => {
                        setDraftType(
                            undefined,
                        );
                        setDraftStatus(
                            undefined,
                        );
                        reset();
                    }}
                />
            </div>

            <DataTable
                table={{
                    columns: cols,
                    data: h.data,
                    loading: h.isLoading,
                    fetching: h.isFetching,
                    keyExtractor: (row) => row.id,
                    emptyText: x("notFound"),
                    renderActions: (row) => (
                    <TableActions>
                        <TableActionItem
                            icon={
                                <Users className="h-4 w-4" />
                            }
                            label={x("players")}
                            onClick={() =>
                                router.push(
                                    `/club/${slug}/exchange-sessions/${row.id}/players`,
                                )
                            }
                        />

                        {canUpdate &&
                            row.status ===
                            "upcoming" && (
                                <TableActionItem
                                    icon={
                                        <CheckCircle2 className="h-4 w-4" />
                                    }
                                    label={x(
                                        "complete",
                                    )}
                                    onClick={() =>
                                        h.handleComplete(
                                            row.id,
                                        )
                                    }
                                />
                            )}

                        {canUpdate && (
                            <TableActionItem
                                icon={
                                    <Pencil className="h-4 w-4" />
                                }
                                label={t(
                                    "edit",
                                )}
                                onClick={() => {
                                    setSelected(
                                        row,
                                    );
                                    setOpen(
                                        true,
                                    );
                                }}
                            />
                        )}

                        {canDelete && (
                            <TableActionItem
                                icon={
                                    <Trash2 className="h-4 w-4" />
                                }
                                label={t(
                                    "delete",
                                )}
                                variant="danger"
                                onClick={() =>
                                    setDel(
                                        row,
                                    )
                                }
                            />
                        )}
                    </TableActions>
                    ),
                }}
                pagination={{
                    page: params.page,
                    limit: params.limit,
                    total: h.total,
                    onPageChange: setPage,
                    onLimitChange: setLimit,
                }}
            />

            {/* Create / Edit */}
            <FormModal
                isOpen={open}
                onClose={close}
                onSubmit={async (
                    values,
                    translations?: TranslationEntry[],
                ) => {
                    const result =
                        selected
                            ? await h.handleEdit(
                                selected.id,
                                values,
                                translations,
                            )
                            : await h.handleCreate(
                                values,
                                translations,
                            );

                    if (!result) {
                        close();
                    }

                    return result;
                }}
                title={
                    selected
                        ? x("edit")
                        : x("create")
                }
                fields={fields}
                translatableFields={tf}
                initialValues={init}
                initialTranslations={tr}
                isEdit={!!selected}
                submitting={
                    selected
                        ? h.isUpdating
                        : h.isCreating
                }
            />

            {/* Delete */}
            <DeleteConfirmModal
                isOpen={!!del}
                title={t(
                    "deleteConfirmTitle",
                )}
                description={t(
                    "deleteConfirmDesc",
                )}
                message={
                    del
                        ? x(
                            "deleteConfirmMsg",
                            {
                                name:
                                    getTranslatedTitle(
                                        del.translations,
                                        locale,
                                    ) ||
                                    del.court_name,
                            },
                        )
                        : ""
                }
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => {
                    if (del) {
                        h.handleDelete(
                            del.id,
                        );
                    }

                    setDel(null);
                }}
                onCancel={() =>
                    setDel(null)
                }
                loading={h.isDeleting}
            />
        </div>
    );
}

