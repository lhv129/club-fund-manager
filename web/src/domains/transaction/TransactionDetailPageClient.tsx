"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Building2, CalendarClock, CircleDollarSign, CreditCard, FileText, Hash, Landmark, Radio, UserRound } from "lucide-react";

import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { Card } from "@/components/shared/ui/Card";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useClub } from "@/domains/club/hooks/useClub";
import { useTransaction } from "@/domains/transaction/hooks/useTransactions";
import { useRouter } from "@/i18n/routing";
import { formatAmount, formatDateTime } from "@/utils";

function DetailItem({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
    return <div className="flex gap-3 rounded-xl border border-border bg-background px-4 py-3.5"><div className="mt-0.5 text-foreground-muted">{icon}</div><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p><div className={`mt-1 break-words text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</div></div></div>;
}

export function TransactionDetailPageClient({ id }: { id: number }) {
    const locale = useLocale();
    const t = useTranslations("common");
    const tt = useTranslations("transaction");
    const router = useRouter();
    const { club, slug } = useClub();
    const query = useTransaction(slug ?? "", id);
    const transaction = query.data?.data;
    if (!club || !slug) return null;
    if (query.isLoading) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} extraItems={[{ label: tt("detailTitle") }]} /><div className="h-72 animate-pulse rounded-2xl border border-border bg-background-subtle" /></div>;
    if (!transaction) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} extraItems={[{ label: tt("detailTitle") }]} /><Card><div className="py-12 text-center text-foreground-muted">{tt("detailNotFound")}</div></Card></div>;
    const isIncome = transaction.type === "income";
    const listHref = clubRoute(slug, CLUB_SUBROUTES.transactions);
    return <div className="space-y-6">
        <Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} extraItems={[{ label: `#${transaction.id}` }]} />
        <button onClick={() => router.push(listHref as never)} className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" />{tt("backToList")}</button>
        <section className={`overflow-hidden rounded-2xl border ${isIncome ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-rose-500/20 bg-rose-500/[0.04]"}`}>
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isIncome ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>{isIncome ? <ArrowDownLeft className="h-7 w-7" /> : <ArrowUpRight className="h-7 w-7" />}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold text-foreground">{tt("detailTitle")} #{transaction.id}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isIncome ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>{tt(transaction.type)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${transaction.is_active ? "bg-sky-500/10 text-sky-600" : "bg-zinc-500/10 text-zinc-500"}`}>{transaction.is_active ? t("active") : t("inactive")}</span></div><p className="mt-1 text-sm text-foreground-muted">{formatDateTime(transaction.transaction_date, locale)}</p></div></div>
                <div className="sm:text-right"><p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">{tt("amount")}</p><p className={`mt-1 text-3xl font-bold tabular-nums ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>{isIncome ? "+" : "−"}{formatAmount(transaction.amount, "đ", locale)}</p><p className="mt-1 text-xs text-foreground-muted">{tt("balance")}: {formatAmount(transaction.balance, "đ", locale)}</p></div>
            </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
            <Card title={tt("transactionInformation")}><div className="grid gap-3 sm:grid-cols-2"><DetailItem icon={<CalendarClock className="h-4 w-4" />} label={tt("transactionDate")} value={formatDateTime(transaction.transaction_date, locale)} /><DetailItem icon={<CircleDollarSign className="h-4 w-4" />} label={tt("source")} value={transaction.source ? tt(`source${transaction.source.charAt(0).toUpperCase()}${transaction.source.slice(1)}`) : "—"} /><DetailItem icon={<Hash className="h-4 w-4" />} label={tt("referenceCode")} value={transaction.reference_code} mono /><DetailItem icon={<Radio className="h-4 w-4" />} label={tt("webhookSource")} value={transaction.webhook_config?.type?.toUpperCase()} /><div className="sm:col-span-2"><DetailItem icon={<FileText className="h-4 w-4" />} label={t("description")} value={transaction.description} /></div></div></Card>
            <Card title={tt("bankInformation")}><div className="grid gap-3 sm:grid-cols-2"><DetailItem icon={<Landmark className="h-4 w-4" />} label={tt("bank")} value={transaction.bank_account?.bank ? `${transaction.bank_account.bank.name} (${transaction.bank_account.bank.code})` : "—"} /><DetailItem icon={<CreditCard className="h-4 w-4" />} label={tt("accountNumber")} value={transaction.bank_account?.account_number} mono /><div className="sm:col-span-2"><DetailItem icon={<Building2 className="h-4 w-4" />} label={tt("accountName")} value={transaction.bank_account?.account_name} /></div></div></Card>
            <Card title={tt("senderInformation")}><div className="grid gap-3 sm:grid-cols-2"><DetailItem icon={<UserRound className="h-4 w-4" />} label={tt("senderName")} value={transaction.sender_name} /><DetailItem icon={<CreditCard className="h-4 w-4" />} label={tt("senderAccount")} value={transaction.sender_account} mono /></div></Card>
            <Card title={tt("systemInformation")}><div className="grid gap-3 sm:grid-cols-2"><DetailItem icon={<Hash className="h-4 w-4" />} label="ID" value={transaction.id} /><DetailItem icon={<Hash className="h-4 w-4" />} label={tt("sortOrder")} value={transaction.sort_order} /><DetailItem icon={<CalendarClock className="h-4 w-4" />} label={t("createdAt")} value={formatDateTime(transaction.created_at, locale)} /><DetailItem icon={<CalendarClock className="h-4 w-4" />} label={tt("updatedAt")} value={formatDateTime(transaction.updated_at, locale)} /></div></Card>
        </div>
    </div>;
}
