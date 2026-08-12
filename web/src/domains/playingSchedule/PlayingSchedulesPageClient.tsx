"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { FormModal, type FormFieldDef, type TranslatableFieldDef, type TranslationEntry } from "@/components/shared/forms/FormModal";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import Select from "@/components/shared/ui/Select";
import { Table, type ColumnDef } from "@/components/shared/ui/Table";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { TableActions } from "@/components/shared/ui/TableActions";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { useListParams } from "@/hooks/useListParams";
import { getTranslatedTitle } from "@/lib/translations";
import { usePlayingSchedules } from "./hooks/usePlayingSchedules";
import type { PlayingSchedule, PlayingScheduleFilters } from "./types";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export function PlayingSchedulesPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tp = useTranslations("playingSchedule");
    const { club, slug } = useClub();
    const { hasPermission, isSuperAdmin } = useAuth();
    const canCreate = isSuperAdmin || hasPermission("playing_schedule", "create", club?.id);
    const canUpdate = isSuperAdmin || hasPermission("playing_schedule", "update", club?.id);
    const canDelete = isSuperAdmin || hasPermission("playing_schedule", "delete", club?.id);

    const { params, setPage, setLimit, updateMany, reset } = useListParams<PlayingScheduleFilters>({
        defaultFilters: { search: "", weekday: undefined, is_active: undefined },
        defaultSortBy: "sort_order",
        defaultSortDir: "asc",
    });
    const [draftWeekday, setDraftWeekday] = useState<number | undefined>(params.weekday);
    const [draftActive, setDraftActive] = useState<0 | 1 | undefined>(params.is_active);
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<PlayingSchedule | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PlayingSchedule | null>(null);
    const schedules = usePlayingSchedules({ ...params, club_slug: slug });

    useEffect(() => setDraftWeekday(params.weekday), [params.weekday]);
    useEffect(() => setDraftActive(params.is_active), [params.is_active]);

    const fields: FormFieldDef[] = useMemo(() => [
        { name: "weekday", label: tp("weekday"), type: "select", required: true, options: WEEKDAYS.map((value) => ({ value: String(value), label: tp(`weekday_${value}`) })) },
        { name: "court_name", label: tp("courtName"), type: "text", required: true },
        { name: "court_address", label: tp("courtAddress"), type: "text" },
        { name: "start_time", label: tp("startTime"), type: "time-select", required: true },
        { name: "end_time", label: tp("endTime"), type: "time-select", required: true },
        { name: "auto_generate", label: tp("autoGenerate"), type: "toggle" },
        { name: "weeks_ahead", label: tp("weeksAhead"), type: "number" },
        { name: "sort_order", label: t("sortOrder"), type: "number" },
        { name: "is_active", label: t("active"), type: "toggle" },
    ], [t, tp]);
    const translatableFields: TranslatableFieldDef[] = useMemo(() => [
        { name: "title", label: tp("titleField"), type: "text", required: true },
        { name: "note", label: tp("note"), type: "textarea" },
    ], [tp]);

    const initialValues = selected ? {
        weekday: String(selected.weekday), court_name: selected.court_name,
        court_address: selected.court_address ?? "", start_time: selected.start_time,
        end_time: selected.end_time, auto_generate: selected.auto_generate ? "1" : "0",
        weeks_ahead: String(selected.weeks_ahead ?? ""), sort_order: String(selected.sort_order),
        is_active: selected.is_active ? "1" : "0",
    } : {
        weekday: "1", court_name: "", court_address: "", start_time: "20:00", end_time: "22:00",
        auto_generate: "1", weeks_ahead: "8", sort_order: "1", is_active: "1",
    };
    const initialTranslations = selected
        ? Object.fromEntries((selected.translations ?? []).map((translation) => [translation.locale, { ...translation }]))
        : { vi: { locale: "vi", title: "", note: "" }, en: { locale: "en", title: "", note: "" } };

    const columns: ColumnDef<PlayingSchedule>[] = [
        { key: "no", label: t("no"), render: (_row, index) => <span className="text-xs text-foreground-muted">{(params.page - 1) * params.limit + index + 1}</span> },
        { key: "title", label: tp("titleField"), render: (row) => <span className="font-medium text-foreground">{getTranslatedTitle(row.translations, locale) || "—"}</span> },
        { key: "weekday", label: tp("weekday"), render: (row) => tp(`weekday_${row.weekday}`) },
        { key: "court", label: tp("courtName"), render: (row) => <div><p>{row.court_name}</p><p className="text-xs text-foreground-muted">{row.start_time} - {row.end_time}</p></div> },
        { key: "is_active", label: t("status"), render: (row) => <ToggleSwitch checked={row.is_active} loading={schedules.togglingIds.has(row.id)} disabled={!canUpdate} onChange={() => schedules.handleToggleStatus(row.id)} /> },
    ];

    if (!club || !slug) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-semibold">{tp("title")}</h1><p className="text-sm text-foreground-muted">{tp("totalCount", { count: schedules.total.toLocaleString() })}</p></div>
                {canCreate && <button type="button" onClick={() => { setSelected(null); setModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />{tp("create")}</button>}
            </div>
            <FilterBar search={params.search} sortBy={params.sort_by} sortDir={params.sort_dir} sortOptions={[{ value: "weekday", label: tp("weekday") }, { value: "sort_order", label: t("sortOrder") }, { value: "created_at", label: t("createdAt") }]} showStatusFilter={false} loading={schedules.isLoading} onApply={(filters: AppliedFilters) => updateMany({ search: filters.search, sort_by: filters.sort_by, sort_dir: filters.sort_dir, weekday: draftWeekday, is_active: draftActive })} onReset={() => { setDraftWeekday(undefined); setDraftActive(undefined); reset(); }} extraFilters={<><Select label={tp("weekday")} options={WEEKDAYS.map((value) => ({ value: String(value), label: tp(`weekday_${value}`) }))} value={draftWeekday === undefined ? "" : String(draftWeekday)} onChange={(value) => setDraftWeekday(value === "" ? undefined : Number(value))} placeholder={t("all")} /><Select label={t("status")} options={[{ value: "1", label: t("active") }, { value: "0", label: t("inactive") }]} value={draftActive === undefined ? "" : String(draftActive)} onChange={(value) => setDraftActive(value === "" ? undefined : Number(value) as 0 | 1)} placeholder={t("all")} /></>} />
            <Table columns={columns} data={schedules.data} loading={schedules.isLoading} keyExtractor={(row) => row.id} emptyText={tp("notFound")} renderActions={(row) => <TableActions>{canUpdate && <TableActionItem icon={<Pencil className="h-4 w-4" />} label={t("edit")} onClick={() => { setSelected(row); setModalOpen(true); }} />}{canDelete && <TableActionItem icon={<Trash2 className="h-4 w-4" />} label={t("delete")} variant="danger" onClick={() => setDeleteTarget(row)} />}</TableActions>} />
            <Pagination page={params.page} limit={params.limit} total={schedules.total} onPageChange={setPage} onLimitChange={setLimit} />
            <FormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); }} onSubmit={async (values, translations?: TranslationEntry[]) => { const result = selected ? await schedules.handleEdit(selected.id, values, translations) : await schedules.handleCreate(values, translations); if (!result) { setModalOpen(false); setSelected(null); } return result; }} title={selected ? tp("edit") : tp("create")} submitting={selected ? schedules.isUpdating : schedules.isCreating} isEdit={!!selected} fields={fields} translatableFields={translatableFields} initialValues={initialValues} initialTranslations={initialTranslations} />
            <DeleteConfirmModal isOpen={!!deleteTarget} title={t("deleteConfirmTitle")} description={t("deleteConfirmDesc")} message={deleteTarget ? tp("deleteConfirmMsg", { title: getTranslatedTitle(deleteTarget.translations, locale) }) : ""} confirmText={t("delete")} cancelText={t("cancel")} onConfirm={() => { if (deleteTarget) schedules.handleDeleteConfirm(deleteTarget.id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} loading={schedules.isDeleting} />
        </div>
    );
}
