"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import {
    FormModal,
    type FormFieldDef,
    type SubmitResult,
} from "@/components/shared/forms/FormModal";
import { DeleteConfirmModal } from "@/components/shared/forms/DeleteConfirmModal";
import {
    FilterBar,
    type AppliedFilters,
} from "@/components/shared/ui/FilterBar";
import { DataTable } from "@/components/shared/ui/DataTable";
import Select from "@/components/shared/ui/Select";
import DatePicker from "@/components/shared/ui/DatePicker";
import type { ColumnDef } from "@/components/shared/ui/Table";
import { TableActions } from "@/components/shared/ui/TableActions";
import { TableActionItem } from "@/components/shared/ui/TableActionItem";
import CustomImage from "@/components/shared/media/CustomImage";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { bankAccountService } from "@/domains/bankAccount/services/bankAccountService";
import type { BankAccount } from "@/domains/bankAccount/types";
import { useClub } from "@/domains/club/hooks/useClub";
import { useTransactions } from "@/domains/transaction/hooks/useTransactions";
import type {
    Transaction,
    TransactionFilters,
    TransactionType,
} from "@/domains/transaction/types";
import { useListParams } from "@/hooks/useListParams";
import { useRouter } from "@/i18n/routing";
import type { PaginatedResponse } from "@/types/api";
import { formatAmount, formatDateTime } from "@/utils";

function toDateTimeLocal(value: string | null | undefined): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 16);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
}

function currentDateTimeLocal(): string {
    return toDateTimeLocal(new Date().toISOString());
}

function isManagedSource(source: Transaction["source"]): boolean {
    return source === "cash" || source === "manual";
}

function TransactionTypeBadge({ type, label }: { type: TransactionType; label: string }) {
    const isIncome = type === "income";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isIncome
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-600"
                }`}
        >
            {isIncome ? (
                <ArrowDownLeft className="h-3.5 w-3.5" />
            ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            {label}
        </span>
    );
}

function BankAccountCell({ account }: { account?: BankAccount | null }) {
    if (!account) {
        return <span className="text-sm text-foreground-muted">—</span>;
    }

    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background-secondary">
                <CustomImage
                    src={account.bank?.logo}
                    alt={account.bank?.short_name ?? account.bank?.name ?? "Bank"}
                    className="h-full w-full object-contain p-1.5"
                    fallback={
                        <span className="text-[10px] font-bold text-foreground-muted">
                            {account.bank?.code?.slice(0, 4) ?? "BANK"}
                        </span>
                    }
                    fallbackClassName="flex h-full w-full items-center justify-center"
                />
            </div>

            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                        {account.bank?.short_name ?? account.bank?.code ?? "—"}
                    </span>
                    <span className="text-xs text-foreground-muted">·</span>
                    <span className="truncate font-mono text-xs text-foreground-muted">
                        {account.account_number}
                    </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-foreground-muted">
                    {account.account_name}
                </p>
            </div>
        </div>
    );
}

export function TransactionsPageClient() {
    const locale = useLocale();
    const t = useTranslations("common");
    const tt = useTranslations("transaction");
    const router = useRouter();
    const { club, slug } = useClub();
    const { hasPermission, isSuperAdmin } = useAuth();

    const canCreate =
        isSuperAdmin || hasPermission("transaction", "create", club?.id);
    const canUpdate =
        isSuperAdmin || hasPermission("transaction", "update", club?.id);
    const canDelete =
        isSuperAdmin || hasPermission("transaction", "delete", club?.id);

    const {
        params,
        setPage,
        setLimit,
        updateMany,
        reset,
    } = useListParams<TransactionFilters>({
        defaultFilters: {
            search: "",
            bank_account_id: undefined,
            type: undefined,
            is_active: undefined,
            from_date: undefined,
            to_date: undefined,
        },
        defaultSortBy: "transaction_date",
        defaultSortDir: "desc",
        defaultLimit: 10,
    });

    const [draftBank, setDraftBank] = useState<number | undefined>(params.bank_account_id);
    const [draftType, setDraftType] = useState<TransactionType | undefined>(params.type);
    const [draftFrom, setDraftFrom] = useState(params.from_date ?? "");
    const [draftTo, setDraftTo] = useState(params.to_date ?? "");
    const [selected, setSelected] = useState<Transaction | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const transactions = useTransactions({ ...params, club_slug: slug });

    const bankAccounts = useQuery<PaginatedResponse<BankAccount>>({
        queryKey: ["bank-accounts", slug, "transaction-options"],
        queryFn: () =>
            bankAccountService.list({
                limit: 100,
                is_active: 1,
                club_slug: slug,
            }),
        enabled: Boolean(slug),
    });

    const bankOptions = useMemo(
        () =>
            (bankAccounts.data?.data ?? []).map((account) => ({
                value: String(account.id),
                label: `${account.bank?.code ?? account.bank?.name ?? ""} · ${account.account_number} · ${account.account_name}`,
            })),
        [bankAccounts.data?.data],
    );

    const formFields: FormFieldDef[] = useMemo(() => {
        const descriptionField: FormFieldDef = {
            name: "description",
            label: t("description"),
            type: "textarea",
            placeholder: tt("descriptionPlaceholder"),
        };

        if (selected && !isManagedSource(selected.source)) {
            return [descriptionField];
        }

        const financialFields: FormFieldDef[] = [
            {
                name: "type",
                label: tt("type"),
                type: "select",
                required: true,
                options: [
                    { value: "income", label: tt("income") },
                    { value: "expense", label: tt("expense") },
                ],
                placeholder: t("chooseOption"),
            },
            {
                name: "amount",
                label: tt("amount"),
                type: "number",
                required: true,
            },
            {
                name: "bank_account_id",
                label: tt("bankAccount"),
                type: "select",
                options: bankOptions,
                placeholder: t("chooseOption"),
            },
            {
                name: "transaction_date",
                label: tt("transactionDate"),
                type: "datetime-local",
            },
            descriptionField,
        ];

        if (selected) return financialFields;

        return [
            {
                name: "source",
                label: tt("source"),
                type: "select",
                required: true,
                options: [
                    { value: "manual", label: tt("manual") },
                    { value: "cash", label: tt("cash") },
                ],
                placeholder: t("chooseOption"),
            },
            ...financialFields,
        ];
    }, [bankOptions, selected, t, tt]);

    const initialValues = useMemo(() => {
        if (!selected) {
            return {
                source: "manual",
                type: "income",
                amount: "",
                bank_account_id: "",
                transaction_date: currentDateTimeLocal(),
                description: "",
            };
        }

        return {
            type: selected.type,
            amount: selected.amount,
            bank_account_id:
                selected.bank_account_id == null
                    ? ""
                    : String(selected.bank_account_id),
            transaction_date: toDateTimeLocal(selected.transaction_date),
            description: selected.description ?? "",
        };
    }, [selected]);

    const columns: ColumnDef<Transaction>[] = [
        {
            key: "date",
            label: tt("transactionDate"),
            render: (row) => (
                <span className="whitespace-nowrap text-sm">
                    {formatDateTime(row.transaction_date, locale)}
                </span>
            ),
        },
        {
            key: "type",
            label: tt("type"),
            render: (row) => (
                <TransactionTypeBadge
                    type={row.type}
                    label={tt(row.type)}
                />
            ),
        },
        {
            key: "amount",
            label: tt("amount"),
            render: (row) => (
                <div className="min-w-[130px]">
                    <div
                        className={`text-sm font-bold tabular-nums ${row.type === "income"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                    >
                        {row.type === "income" ? "+" : "−"}
                        {formatAmount(row.amount, "đ", locale)}
                    </div>
                    {row.balance !== null && row.balance !== undefined && (
                        <div className="mt-0.5 text-xs tabular-nums text-foreground-muted">
                            {tt("balance")}: {formatAmount(row.balance, "đ", locale)}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "account",
            label: tt("bankAccount"),
            render: (row) => (
                <BankAccountCell account={row.bank_account} />
            ),
        },
        {
            key: "description",
            label: t("description"),
            render: (row) => (
                <span className="line-clamp-2 max-w-72 text-sm">
                    {row.description || "—"}
                </span>
            ),
        },
        {
            key: "reference",
            label: tt("referenceCode"),
            render: (row) => (
                <span className="font-mono text-xs">
                    {row.reference_code || "—"}
                </span>
            ),
        },
    ];

    if (!club || !slug) return null;

    const closeModal = () => {
        setModalOpen(false);
        setSelected(null);
    };

    const openCreate = () => {
        if (!canCreate) return;
        setSelected(null);
        setModalOpen(true);
    };

    const openEdit = (row: Transaction) => {
        if (!canUpdate) return;
        setSelected(row);
        setModalOpen(true);
    };

    const handleSubmit = async (
        values: Record<string, string>,
    ): Promise<SubmitResult> => {
        if (selected && !canUpdate) return { success: false };
        if (!selected && !canCreate) return { success: false };

        const result = selected
            ? await transactions.handleEdit(selected.id, values)
            : await transactions.handleCreate(values);

        if (!result) closeModal();

        return result;
    };

    const extraFilters = (
        <>
            <div>
                <label className="mb-1 block text-xs font-medium text-foreground-muted">
                    {tt("bankAccount")}
                </label>
                <Select
                    label={tt("bankAccount")}
                    options={bankOptions}
                    value={draftBank === undefined ? "" : String(draftBank)}
                    onChange={(value) =>
                        setDraftBank(value ? Number(value) : undefined)
                    }
                    placeholder={t("all")}
                />
            </div>

            <div>
                <label className="mb-1 block text-xs font-medium text-foreground-muted">
                    {tt("type")}
                </label>
                <Select
                    label={tt("type")}
                    options={[
                        { value: "income", label: tt("income") },
                        { value: "expense", label: tt("expense") },
                    ]}
                    value={draftType ?? ""}
                    onChange={(value) =>
                        setDraftType(
                            value ? (value as TransactionType) : undefined,
                        )
                    }
                    placeholder={t("all")}
                />
            </div>

            <div className="w-full min-w-0 sm:w-44">
                <label className="mb-1 block text-xs font-medium text-foreground-muted">
                    {tt("fromDate")}
                </label>
                <DatePicker
                    value={draftFrom}
                    onChange={setDraftFrom}
                    wrapperClassName="min-w-0 max-w-full"
                />
            </div>

            <div className="w-full min-w-0 sm:w-44">
                <label className="mb-1 block text-xs font-medium text-foreground-muted">
                    {tt("toDate")}
                </label>
                <DatePicker
                    value={draftTo}
                    onChange={setDraftTo}
                    wrapperClassName="min-w-0 max-w-full"
                />
            </div>
        </>
    );

    const handleApplyFilters = (filters: AppliedFilters) => {
        updateMany({
            ...filters,
            bank_account_id: draftBank,
            type: draftType,
            from_date: draftFrom || undefined,
            to_date: draftTo || undefined,
        });
    };

    const handleReset = () => {
        setDraftBank(undefined);
        setDraftType(undefined);
        setDraftFrom("");
        setDraftTo("");
        reset();
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;

        void transactions.handleDeleteConfirm(id).then((deleted) => {
            if (deleted) setDeleteTarget(null);
        });
    };

    return (
        <div className="space-y-6">
            <Breadcrumb
                navItems={CLUB_NAV_ITEMS(slug)}
                homeHref={clubRoute(slug)}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">
                        {tt("title")}
                    </h1>
                    <p className="mt-1 text-sm text-foreground-muted">
                        {tt("totalCount", { count: transactions.total })}
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

            <FilterBar
                searchClassName="basis-full sm:w-auto sm:basis-auto"
                search={params.search}
                isActive={params.is_active}
                sortBy={params.sort_by}
                sortDir={params.sort_dir}
                sortOptions={[
                    { value: "transaction_date", label: tt("transactionDate") },
                    { value: "amount", label: tt("amount") },
                    { value: "balance", label: tt("balance") },
                    { value: "type", label: tt("type") },
                    { value: "sort_order", label: t("sortOrder") },
                    { value: "created_at", label: t("createdAt") },
                ]}
                loading={transactions.isFetching}
                extraFilters={extraFilters}
                onApply={handleApplyFilters}
                onReset={handleReset}
            />

            <DataTable
                table={{
                    columns,
                    data: transactions.data,
                    loading: transactions.isLoading,
                    fetching: transactions.isFetching,
                    keyExtractor: (row) => row.id,
                    emptyText: tt("notFound"),
                    renderActions: (row) => (
                        <TableActions>
                            <TableActionItem
                                icon={<Eye className="h-4 w-4" />}
                                label={t("view")}
                                onClick={() =>
                                    router.push(
                                        `${clubRoute(
                                            slug,
                                            CLUB_SUBROUTES.transactions,
                                        )}/${row.id}` as never,
                                    )
                                }
                            />

                            {canUpdate && (
                                <TableActionItem
                                    icon={<Pencil className="h-4 w-4" />}
                                    label={t("edit")}
                                    onClick={() => openEdit(row)}
                                />
                            )}

                            {canDelete && isManagedSource(row.source) && (
                                <TableActionItem
                                    icon={<Trash2 className="h-4 w-4" />}
                                    label={t("delete")}
                                    variant="danger"
                                    onClick={() => setDeleteTarget(row)}
                                />
                            )}
                        </TableActions>
                    ),
                }}
                pagination={{
                    page: params.page,
                    limit: params.limit,
                    total: transactions.total,
                    onPageChange: setPage,
                    onLimitChange: setLimit,
                }}
            />

            <FormModal
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selected ? t("edit") : t("create")}
                fields={formFields}
                initialValues={initialValues}
                isEdit={Boolean(selected)}
                submitting={
                    selected
                        ? transactions.isUpdating
                        : transactions.isCreating
                }
            />

            <DeleteConfirmModal
                isOpen={Boolean(deleteTarget)}
                title={t("deleteConfirmTitle")}
                description={t("deleteConfirmDesc")}
                message={t("deleteConfirmMessage")}
                confirmText={t("delete")}
                cancelText={t("cancel")}
                onConfirm={() => {
                    if (!deleteTarget || !canDelete) return;
                    handleDelete(deleteTarget.id);
                }}
                onCancel={() => setDeleteTarget(null)}
                loading={transactions.isDeleting}
            />
        </div>
    );
}