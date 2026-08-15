"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Eye, Pencil } from "lucide-react";

import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { FormModal, type FormFieldDef, type SubmitResult } from "@/components/shared/forms/FormModal";
import { FilterBar, type AppliedFilters } from "@/components/shared/ui/FilterBar";
import { DataTable } from "@/components/shared/ui/DataTable";
import Select from "@/components/shared/ui/Select";
import DatePicker from "@/components/shared/ui/DatePicker";
import type { ColumnDef } from "@/components/shared/ui/Table";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { bankAccountService } from "@/domains/bankAccount/services/bankAccountService";
import type { BankAccount } from "@/domains/bankAccount/types";
import { useClub } from "@/domains/club/hooks/useClub";
import { useTransactions } from "@/domains/transaction/hooks/useTransactions";
import type { Transaction, TransactionFilters, TransactionType } from "@/domains/transaction/types";
import { useListParams } from "@/hooks/useListParams";
import { useRouter } from "@/i18n/routing";
import type { PaginatedResponse } from "@/types/api";
import { formatAmount, formatDateTime } from "@/utils";

export function TransactionsPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tt = useTranslations("transaction");
    const router = useRouter();
    const { club, slug } = useClub();
    const { hasPermission, isSuperAdmin } = useAuth();
    const canUpdate = isSuperAdmin || hasPermission("transaction", "update", club?.id);

    const { params, setPage, setLimit, updateMany, reset } = useListParams<TransactionFilters>({
        defaultFilters: { search: "", bank_account_id: undefined, type: undefined, is_active: undefined, from_date: undefined, to_date: undefined },
        defaultSortBy: "transaction_date",
        defaultSortDir: "desc",
        defaultLimit: 15,
    });
    const [draftBank, setDraftBank] = useState<number | undefined>(params.bank_account_id);
    const [draftType, setDraftType] = useState<TransactionType | undefined>(params.type);
    const [draftFrom, setDraftFrom] = useState(params.from_date ?? "");
    const [draftTo, setDraftTo] = useState(params.to_date ?? "");
    const [selected, setSelected] = useState<Transaction | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const transactions = useTransactions({ ...params, club_slug: slug });
    const bankAccounts = useQuery<PaginatedResponse<BankAccount>>({
        queryKey: ["bank-accounts", slug, "transaction-options"],
        queryFn: () => bankAccountService.list({ limit: 100, is_active: 1, club_slug: slug }),
        enabled: Boolean(slug),
    });
    const bankOptions = (bankAccounts.data?.data ?? []).map((account) => ({
        value: String(account.id),
        label: `${account.bank?.code ?? account.bank?.name ?? ""} · ${account.account_number} · ${account.account_name}`,
    }));
    const fields: FormFieldDef[] = useMemo(() => [
        { name: "description", label: t("description"), type: "textarea", placeholder: tt("descriptionPlaceholder") },
    ], [t, tt]);
    const initialValues = { description: selected?.description ?? "" };
    const columns: ColumnDef<Transaction>[] = [
        { key: "date", label: tt("transactionDate"), render: (row) => <span className="whitespace-nowrap text-sm">{formatDateTime(row.transaction_date, locale)}</span> },
        { key: "type", label: tt("type"), render: (row) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{tt(row.type)}</span> },
        { key: "amount", label: tt("amount"), render: (row) => <span className={`font-semibold tabular-nums ${row.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{row.type === "income" ? "+" : "−"}{formatAmount(row.amount, "đ", locale)}</span> },
        { key: "account", label: tt("bankAccount"), render: (row) => <div><p className="text-sm font-medium">{row.bank_account?.bank?.code ?? "—"} · {row.bank_account?.account_number ?? "—"}</p><p className="text-xs text-foreground-muted">{row.bank_account?.account_name ?? "—"}</p></div> },
        { key: "description", label: t("description"), render: (row) => <span className="line-clamp-2 max-w-72 text-sm">{row.description || "—"}</span> },
        { key: "reference", label: tt("referenceCode"), render: (row) => <span className="font-mono text-xs">{row.reference_code || "—"}</span> },
    ];
    if (!club || !slug) return null;
    const submit = async (values: Record<string, string>): Promise<SubmitResult> => {
        if (!selected) return { success: false };
        const result = await transactions.handleEdit(selected.id, values);
        if (!result) { setModalOpen(false); setSelected(null); }
        return result;
    };
    const extraFilters = <>
        <div><label className="mb-1 block text-xs font-medium text-foreground-muted">{tt("bankAccount")}</label><Select label={tt("bankAccount")} options={bankOptions} value={draftBank === undefined ? "" : String(draftBank)} onChange={(v) => setDraftBank(v ? Number(v) : undefined)} placeholder={t("all")} /></div>
        <div><label className="mb-1 block text-xs font-medium text-foreground-muted">{tt("type")}</label><Select label={tt("type")} options={[{ value: "income", label: tt("income") }, { value: "expense", label: tt("expense") }]} value={draftType ?? ""} onChange={(v) => setDraftType((v || undefined) as TransactionType | undefined)} placeholder={t("all")} /></div>
        <div className="w-full min-w-0 sm:w-44"><label className="mb-1 block text-xs font-medium text-foreground-muted">{tt("fromDate")}</label><DatePicker value={draftFrom} onChange={setDraftFrom} wrapperClassName="min-w-0 max-w-full" /></div>
        <div className="w-full min-w-0 sm:w-44"><label className="mb-1 block text-xs font-medium text-foreground-muted">{tt("toDate")}</label><DatePicker value={draftTo} onChange={setDraftTo} wrapperClassName="min-w-0 max-w-full" /></div>
    </>;
    return <div className="space-y-6">
        <Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-semibold text-foreground">{tt("title")}</h1><p className="mt-1 text-sm text-foreground-muted">{tt("totalCount", { count: transactions.total })}</p></div></div>
        <FilterBar searchClassName="basis-full sm:w-auto sm:basis-auto" search={params.search} isActive={params.is_active} sortBy={params.sort_by} sortDir={params.sort_dir} sortOptions={[{ value: "transaction_date", label: tt("transactionDate") }, { value: "amount", label: tt("amount") }, { value: "balance", label: tt("balance") }, { value: "type", label: tt("type") }, { value: "sort_order", label: t("sortOrder") }, { value: "created_at", label: t("createdAt") }]} loading={transactions.isFetching} extraFilters={extraFilters} onApply={(filters: AppliedFilters) => updateMany({ ...filters, bank_account_id: draftBank, type: draftType, from_date: draftFrom || undefined, to_date: draftTo || undefined })} onReset={() => { setDraftBank(undefined); setDraftType(undefined); setDraftFrom(""); setDraftTo(""); reset(); }} />
        <DataTable table={{ columns, data: transactions.data, loading: transactions.isLoading, fetching: transactions.isFetching, keyExtractor: (row) => row.id, emptyText: tt("notFound"), renderActions: (row) => <TableActions><TableActionItem icon={<Eye className="h-4 w-4" />} label={t("view")} onClick={() => router.push(`${clubRoute(slug, CLUB_SUBROUTES.transactions)}/${row.id}` as never)} />{canUpdate && <TableActionItem icon={<Pencil className="h-4 w-4" />} label={t("edit")} onClick={() => { setSelected(row); setModalOpen(true); }} />}</TableActions> }} pagination={{ page: params.page, limit: params.limit, total: transactions.total, onPageChange: setPage, onLimitChange: setLimit }} />
        <FormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); }} onSubmit={submit} title={tt("edit")} fields={fields} initialValues={initialValues} isEdit submitting={transactions.isUpdating} />
    </div>;
}

