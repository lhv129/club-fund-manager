"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { Table, type ColumnDef } from "@/components/shared/ui/Table";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { Pagination } from "@/components/shared/ui/Pagination";
import Select from "@/components/shared/ui/Select";
import ToggleSwitch from "@/components/shared/ui/ToggleSwitch";
import { FormModalWithMedia, type FormFieldDef, type SubmitResult } from "@/components/shared/forms/FormModalWithMedia";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { useListParams } from "@/hooks/useListParams";
import { useBanks } from "@/domains/bank/hooks/useBanks";
import type { Bank, BankFilters } from "@/domains/bank/types";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { MODULE_SLUGS, PERMISSION_ACTIONS } from "@/constants";
import CustomImage from "@/components/shared/media/CustomImage";

export function BanksPageClient() {
    const t = useTranslations("common");
    const tb = useTranslations("bank");
    const { hasPermission, isSuperAdmin } = useAuth();
    const canCreate = isSuperAdmin || hasPermission(MODULE_SLUGS.bank, PERMISSION_ACTIONS.create);
    const canUpdate = isSuperAdmin || hasPermission(MODULE_SLUGS.bank, PERMISSION_ACTIONS.update);
    const canDelete = isSuperAdmin || hasPermission(MODULE_SLUGS.bank, PERMISSION_ACTIONS.delete);
    const { params, setPage, setLimit, updateMany, reset } = useListParams<BankFilters>({ defaultFilters: { search: "", is_active: undefined }, defaultSortBy: "sort_order", defaultSortDir: "asc" });
    const [draftIsActive, setDraftIsActive] = useState<0 | 1 | undefined>(params.is_active);
    useEffect(() => setDraftIsActive(params.is_active), [params.is_active]);
    const { data, total, isLoading, isCreating, isUpdating, isDeleting, togglingIds, handleCreate, handleEdit, handleDeleteConfirm, handleToggleStatus } = useBanks(params);
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<Bank | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
    const closeModal = () => { setModalOpen(false); setSelected(null); };
    const handleSubmit = async (formData: FormData): Promise<SubmitResult> => {
        const isActive = formData.get("is_active");
        formData.set("is_active", isActive === "1" || isActive === "true" ? "1" : "0");
        const result = selected ? await handleEdit(selected.id, formData) : await handleCreate(formData);
        if (!result) closeModal();
        return result;
    };
    const formFields: FormFieldDef[] = useMemo(() => [
        { name: "code", label: tb("code"), type: "text", required: true, placeholder: tb("codePlaceholder") },
        { name: "name", label: tb("name"), type: "text", required: true, placeholder: tb("namePlaceholder") },
        { name: "short_name", label: tb("shortName"), type: "text", placeholder: tb("shortNamePlaceholder") },
        { name: "bin", label: tb("bin"), type: "text", placeholder: tb("binPlaceholder") },
        { name: "swift_code", label: tb("swiftCode"), type: "text", placeholder: tb("swiftCodePlaceholder") },
        { name: "sort_order", label: t("sortOrder"), type: "number", required: true, placeholder: "0" },
        { name: "is_active", label: t("active"), type: "toggle" },
    ], [t, tb]);
    const columns: ColumnDef<Bank>[] = [
        { key: "no", label: t("no"), className: "w-14", render: (_row, index) => <span className="text-xs text-foreground-muted">{(params.page - 1) * params.limit + index + 1}</span> },
        {
            key: "name",
            label: tb("name"),
            render: (row) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                        {row.logo ? (
                            <CustomImage
                                src={row.logo}
                                alt={row.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Landmark className="h-4 w-4" />
                        )}
                    </span>

                    <div>
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-foreground-muted">
                            {row.short_name || row.code}
                        </p>
                    </div>
                </div>
            ),
        },
        { key: "code", label: tb("code"), render: (row) => <span className="text-sm text-foreground">{row.code}</span> },
        { key: "bin", label: tb("bin"), render: (row) => <span className="text-sm text-foreground-muted">{row.bin || "—"}</span> },
        { key: "swift_code", label: tb("swiftCode"), render: (row) => <span className="text-sm text-foreground-muted">{row.swift_code || "—"}</span> },
        { key: "is_active", label: t("status"), className: "w-28 text-center", render: (row) => <div className="flex justify-center"><ToggleSwitch checked={row.is_active} loading={togglingIds.has(row.id)} disabled={!canUpdate} onChange={() => handleToggleStatus(row.id)} /></div> },
    ];
    const extraFilters = <Select label={t("status")} options={[{ value: "1", label: t("active") }, { value: "0", label: t("inactive") }]} value={draftIsActive === undefined ? "" : String(draftIsActive)} onChange={(value) => setDraftIsActive(value === "" ? undefined : Number(value) as 0 | 1)} placeholder={t("all")} />;
    return <>
        <div className="space-y-6">
            <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-foreground">{tb("title")}</h1><p className="mt-0.5 text-sm text-foreground-muted">{tb("totalCount", { count: total.toLocaleString() })}</p></div>{canCreate && <button onClick={() => { setSelected(null); setModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"><Plus className="h-4 w-4" />{tb("create")}</button>}</div>
            <div className="space-y-4"><FilterBar search={params.search} sortBy={params.sort_by} sortDir={params.sort_dir} sortOptions={[{ value: "sort_order", label: t("sortOrder") }, { value: "name", label: tb("name") }, { value: "code", label: tb("code") }, { value: "created_at", label: t("createdAt") }]} showStatusFilter={false} loading={isLoading} onApply={(filters: AppliedFilters) => updateMany({ search: filters.search, sort_by: filters.sort_by, sort_dir: filters.sort_dir, is_active: draftIsActive })} onReset={() => { setDraftIsActive(undefined); reset(); }} extraFilters={extraFilters} />
                <Table columns={columns} data={data} loading={isLoading} keyExtractor={(row) => row.id} emptyText={tb("notFound")} renderActions={(row) => <TableActions>{canUpdate && <TableActionItem icon={<Pencil className="h-4 w-4" />} label={t("edit")} onClick={() => { setSelected(row); setModalOpen(true); }} />}{canDelete && <TableActionItem icon={<Trash2 className="h-4 w-4" />} label={t("delete")} variant="danger" onClick={() => setDeleteTarget(row)} />}</TableActions>} />
                <Pagination page={params.page} limit={params.limit} total={total} onPageChange={setPage} onLimitChange={setLimit} /></div>
        </div>
        <FormModalWithMedia isOpen={modalOpen} onClose={closeModal} onSubmit={handleSubmit} title={selected ? tb("edit") : tb("create")} submitting={selected ? isUpdating : isCreating} isEdit={Boolean(selected)} fields={formFields} initialValues={{ code: selected?.code ?? "", name: selected?.name ?? "", short_name: selected?.short_name ?? "", bin: selected?.bin ?? "", swift_code: selected?.swift_code ?? "", sort_order: selected?.sort_order ?? 0, is_active: selected ? (selected.is_active ? "1" : "0") : "1" }} imageFields={[{ name: "logo", label: tb("logo"), initialUrl: selected?.logo ?? null }]} />
        <DeleteConfirmModal isOpen={Boolean(deleteTarget)} title={t("deleteConfirmTitle")} description={t("deleteConfirmDesc")} message={deleteTarget ? tb("deleteConfirmMsg", { name: deleteTarget.name }) : ""} confirmText={t("delete")} cancelText={t("cancel")} onConfirm={() => { if (deleteTarget) handleDeleteConfirm(deleteTarget.id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} loading={isDeleting} />
    </>;
}
