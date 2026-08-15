"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Copy, Pencil, Plus, Trash2, XCircle } from "lucide-react";

import { DataTable } from "@/components/shared/ui/DataTable";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import Select from "@/components/shared/ui/Select";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { type ColumnDef } from "@/components/shared/ui/Table";
import type { SubmitResult } from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import { MODULE_SLUGS, PERMISSION_ACTIONS } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useBankAccounts } from "@/domains/bankAccount/hooks/useBankAccounts";
import { useClub } from "@/domains/club/hooks/useClub";
import { useClubsQuery } from "@/domains/club/hooks/useClubsQuery";
import type { ClubFilters } from "@/domains/club/types";
import { useListParams } from "@/hooks/useListParams";
import { useWebhookConfigs } from "./hooks/useWebhookConfigs";
import type { WebhookConfig, WebhookConfigFilters } from "./types";
import { WebhookConfigFormModal } from "./components/WebhookConfigFormModal";

export function WebhookConfigsPageClient({ scope }: { scope: "admin" | "club" }) {
  const t = useTranslations("common");
  const tw = useTranslations("webhookConfig");
  const locale = useLocale();
  const { club, slug } = useClub();
  const { hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();
  const isAdmin = scope === "admin";
  const clubId = isAdmin ? undefined : club?.id;
  const allowed = (action: string) => isSuperAdmin || isSystemAdmin || hasPermission(MODULE_SLUGS.webhookConfig, action, clubId);
  const canCreate = allowed(PERMISSION_ACTIONS.create);
  const canUpdate = allowed(PERMISSION_ACTIONS.update);
  const canDelete = allowed(PERMISSION_ACTIONS.delete);

  const { params, setPage, setLimit, updateMany, reset } = useListParams<WebhookConfigFilters>({
    defaultFilters: { search: "", club_slug: isAdmin ? undefined : (slug ?? undefined), bank_account_id: "", type: "", is_verified: "" },
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
  });
  const [draftClubSlug, setDraftClubSlug] = useState(params.club_slug ?? "");
  const [draftBankAccountId, setDraftBankAccountId] = useState(String(params.bank_account_id ?? ""));
  const [draftType, setDraftType] = useState(params.type ?? "");
  const [draftVerified, setDraftVerified] = useState(String(params.is_verified ?? ""));
  const [formClubSlug, setFormClubSlug] = useState("");
  const queryParams = { ...params, ...(isAdmin ? {} : { club_slug: slug ?? undefined }) };
  const webhooks = useWebhookConfigs(queryParams);

  const clubListParams = useListParams<ClubFilters>({ defaultFilters: { search: "", is_active: 1 }, defaultSortBy: "sort_order", defaultSortDir: "asc", defaultLimit: 100 });
  const clubsQuery = useClubsQuery(clubListParams.params);
  const bankListParams = useListParams({ defaultFilters: { search: "", club_slug: isAdmin ? formClubSlug : slug ?? undefined, is_active: 1 }, defaultSortBy: "created_at", defaultSortDir: "desc", defaultLimit: 100 });
  const scopedBankParams = {
    ...bankListParams.params,
    club_slug: isAdmin ? formClubSlug || undefined : slug ?? undefined,
  };
  const bankAccountsQuery = useBankAccounts(scopedBankParams as never);

  const clubOptions = useMemo(() => clubsQuery.data.map((item) => {
    const translation = item.translations?.find((entry) => entry.locale === locale) ?? item.translation ?? item.translations?.[0];
    return { value: translation?.slug ?? "", label: translation?.name ?? `#${item.id}` };
  }).filter((item) => item.value), [clubsQuery.data, locale]);
  const bankOptions = useMemo(() => bankAccountsQuery.data.map((item) => ({
    value: String(item.id), label: `${item.account_name} - ${item.account_number}`,
  })), [bankAccountsQuery.data]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<WebhookConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookConfig | null>(null);
  const getClubSlug = (clubId?: number) => {
    const selectedClub = clubsQuery.data.find((item) => item.id === clubId);
    const translation = selectedClub?.translations?.find((entry) => entry.locale === locale)
      ?? selectedClub?.translation
      ?? selectedClub?.translations?.[0];
    return translation?.slug ?? "";
  };
  const closeModal = () => { setModalOpen(false); setSelected(null); };
  const handleSubmit = async (values: Record<string, string>): Promise<SubmitResult> => {
    const payload = { ...values, club_slug: isAdmin ? values.club_slug : (slug ?? "") };
    const result = selected ? await webhooks.handleEdit(selected.id, payload) : await webhooks.handleCreate(payload);
    if (!result) closeModal();
    return result;
  };

  const columns: ColumnDef<WebhookConfig>[] = [
    { key: "no", label: t("no"), className: "w-14", render: (_row, index) => (params.page - 1) * params.limit + index + 1 },
    { key: "bank_account", label: tw("bankAccount"), render: (row) => <div><p className="font-medium text-foreground">{row.bank_account?.account_name ?? "—"}</p><p className="text-xs text-foreground-muted">{row.bank_account?.account_number ?? "—"}</p></div> },
    { key: "type", label: tw("type"), render: (row) => <span className="uppercase">{row.type}</span> },
    { key: "webhook_url", label: tw("webhookUrl"), render: (row) => <div className="flex max-w-md items-center gap-2"><span className="truncate text-xs text-foreground-muted" title={row.webhook_url}>{row.webhook_url}</span><button type="button" aria-label={tw("copyUrl")} onClick={() => navigator.clipboard.writeText(row.webhook_url)}><Copy className="h-3.5 w-3.5" /></button></div> },
    { key: "is_verified", label: tw("verified"), className: "w-28", render: (row) => row.is_verified ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-4 w-4" />{tw("yes")}</span> : <span className="inline-flex items-center gap-1 text-amber-600"><XCircle className="h-4 w-4" />{tw("no")}</span> },
  ];

  const extraFilters = <div className="grid w-full basis-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:basis-auto">
    <div className="flex w-full flex-col gap-1 sm:w-auto"><span className="text-xs font-medium text-foreground-muted">{isAdmin ? tw("club") : tw("bankAccount")}</span>{isAdmin ? <Select className="w-full sm:w-auto" label={tw("club")} options={clubOptions} value={draftClubSlug} onChange={setDraftClubSlug} placeholder={tw("allClubs")} /> : <Select className="w-full sm:w-auto" label={tw("bankAccount")} options={bankOptions} value={draftBankAccountId} onChange={setDraftBankAccountId} placeholder={tw("allBankAccounts")} />}</div>
    <div className="flex w-full flex-col gap-1 sm:w-auto"><span className="text-xs font-medium text-foreground-muted">{tw("type")}</span><Select className="w-full sm:w-auto" label={tw("type")} options={[{ value: "sepay", label: "SePay" }, { value: "casso", label: "Casso" }]} value={draftType} onChange={(value) => setDraftType((value || "") as "" | "casso" | "sepay")} placeholder={t("all")} /></div>
    <div className="flex w-full flex-col gap-1 sm:w-auto"><span className="text-xs font-medium text-foreground-muted">{tw("verified")}</span><Select className="w-full sm:w-auto" label={tw("verified")} options={[{ value: "1", label: tw("yes") }, { value: "0", label: tw("no") }]} value={draftVerified} onChange={setDraftVerified} placeholder={t("all")} /></div>
  </div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-foreground">{tw("title")}</h1><p className="mt-0.5 text-sm text-foreground-muted">{tw("totalCount", { count: webhooks.total })}</p></div>{canCreate && <button onClick={() => { setSelected(null); setFormClubSlug(""); setModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />{tw("create")}</button>}</div>
    <FilterBar searchClassName="basis-full sm:w-auto sm:basis-auto" search={params.search ?? ""} sortBy={params.sort_by} sortDir={params.sort_dir} sortOptions={[{ value: "created_at", label: t("createdAt") }, { value: "type", label: tw("type") }]} showStatusFilter={false} loading={webhooks.isFetching} extraFilters={extraFilters} onApply={(filters: AppliedFilters) => updateMany({ search: filters.search, sort_by: filters.sort_by, sort_dir: filters.sort_dir, club_slug: isAdmin ? draftClubSlug : slug ?? undefined, bank_account_id: isAdmin ? "" : draftBankAccountId, type: draftType, is_verified: draftVerified === "" ? "" : Number(draftVerified) as 0 | 1 })} onReset={() => { setDraftClubSlug(""); setDraftBankAccountId(""); setDraftType(""); setDraftVerified(""); reset(); }} />
    <DataTable table={{ columns, data: webhooks.data, loading: webhooks.isLoading, fetching: webhooks.isFetching, keyExtractor: (row) => row.id, showActions: canUpdate || canDelete, emptyText: tw("notFound"), renderActions: (row) => <TableActions>{canUpdate && <TableActionItem icon={<Pencil className="h-4 w-4" />} label={t("edit")} onClick={() => { setSelected(row); setFormClubSlug(getClubSlug(row.club_id)); setModalOpen(true); }} />}{canDelete && <TableActionItem icon={<Trash2 className="h-4 w-4" />} label={t("delete")} variant="danger" onClick={() => setDeleteTarget(row)} />}</TableActions> }} pagination={{ page: params.page, limit: params.limit, total: webhooks.total, onPageChange: setPage, onLimitChange: setLimit }} />
    <WebhookConfigFormModal isOpen={modalOpen} isAdmin={isAdmin} isEdit={Boolean(selected)} submitting={selected ? webhooks.isUpdating : webhooks.isCreating} clubOptions={clubOptions} bankOptions={bankOptions} initialValues={{ club_slug: isAdmin ? getClubSlug(selected?.club_id) : slug ?? "", bank_account_id: String(selected?.bank_account_id ?? ""), type: selected?.type ?? "sepay" }} onClubChange={setFormClubSlug} onClose={closeModal} onSubmit={handleSubmit} />
    <DeleteConfirmModal isOpen={Boolean(deleteTarget)} title={t("deleteConfirmTitle")} description={t("deleteConfirmDesc")} message={deleteTarget ? tw("deleteConfirmMsg", { type: deleteTarget.type.toUpperCase() }) : ""} confirmText={t("delete")} cancelText={t("cancel")} onConfirm={() => { if (deleteTarget) webhooks.handleDeleteConfirm(deleteTarget.id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} loading={webhooks.isDeleting} />
  </div>;
}
