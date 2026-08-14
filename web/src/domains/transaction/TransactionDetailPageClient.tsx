"use client";

import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Landmark, ReceiptText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/shared/ui/Badge";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { ContributionDetailCard } from "@/domains/monthlyContribution/components/ContributionDetailCard";
import { ContributionDetailRow } from "@/domains/monthlyContribution/components/ContributionDetailRow";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useClub } from "@/domains/club/hooks/useClub";
import { useTransaction } from "@/domains/transaction/hooks/useTransactions";
import { useRouter } from "@/i18n/routing";
import { formatAmount, formatDateTime } from "@/utils";

export function TransactionDetailPageClient({ id }: { id: number }) {
    const locale = useLocale(); const t = useTranslations("common"); const tt = useTranslations("transaction"); const router = useRouter(); const { club, slug } = useClub(); const query = useTransaction(slug ?? "", id); const item = query.data?.data;
    if (!club || !slug) return null;
    const listHref = clubRoute(slug, CLUB_SUBROUTES.transactions);
    if (query.isLoading) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} /><div className="h-40 animate-pulse rounded-2xl border border-border bg-background-subtle" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-72 animate-pulse rounded-2xl border border-border bg-background-subtle" /><div className="h-72 animate-pulse rounded-2xl border border-border bg-background-subtle" /></div></div>;
    if (!item) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} /><div className="rounded-2xl border border-dashed border-border bg-background-subtle py-14 text-center text-sm text-foreground-muted">{tt("detailNotFound")}</div></div>;
    const isIncome = item.type === "income"; const FlowIcon = isIncome ? ArrowDownLeft : ArrowUpRight;
    return <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} extraItems={[{ label: tt("detailTitle") }]} /><button type="button" onClick={() => router.push(listHref as never)} className="group inline-flex min-h-10 items-center gap-2 px-1 text-sm font-medium text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />{tt("backToList")}</button>
        <section className={`relative overflow-hidden rounded-2xl border px-5 py-5 shadow-sm sm:px-7 sm:py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 ${isIncome ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.10] via-background to-background" : "border-rose-500/20 bg-gradient-to-br from-rose-500/[0.10] via-background to-background"}`}><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isIncome ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}><FlowIcon className="h-6 w-6" /></span><div><Badge variant={isIncome ? "active" : "cancelled"} title={tt(item.type)} /><p className="mt-2 text-sm text-foreground-muted">{formatDateTime(item.transaction_date, locale)}</p></div></div><div className="sm:text-right"><p className="text-xs font-medium text-foreground-muted">{tt("amount")}</p><p className={`mt-1 text-3xl font-bold tabular-nums sm:text-4xl ${isIncome ? "text-emerald-600" : "text-rose-600"}`}>{isIncome ? "+" : "−"}{formatAmount(item.amount, "đ", locale)}</p><p className="mt-1 text-xs text-foreground-muted">{tt("balance")}: {formatAmount(item.balance, "đ", locale)}</p></div></div></section>
        <div className="grid gap-5 lg:grid-cols-2"><ContributionDetailCard icon={ReceiptText} title={tt("transactionInformation")} description={tt("transactionInformationDescription")}><dl><ContributionDetailRow label={tt("transactionDate")} value={formatDateTime(item.transaction_date, locale)} /><ContributionDetailRow label={tt("source")} value={item.source ? tt(`source${item.source.charAt(0).toUpperCase()}${item.source.slice(1)}`) : "—"} /><ContributionDetailRow label={tt("referenceCode")} value={item.reference_code} mono /><ContributionDetailRow label={tt("webhookSource")} value={item.webhook_config?.type?.toUpperCase()} /><ContributionDetailRow label={t("description")} value={item.description} /></dl></ContributionDetailCard>
        <ContributionDetailCard icon={Landmark} title={tt("bankInformation")} description={tt("bankInformationDescription")} delay="short"><dl><ContributionDetailRow label={tt("bank")} value={item.bank_account?.bank ? `${item.bank_account.bank.name} (${item.bank_account.bank.code})` : "—"} /><ContributionDetailRow label={tt("accountNumber")} value={item.bank_account?.account_number} mono /><ContributionDetailRow label={tt("accountName")} value={item.bank_account?.account_name} /></dl></ContributionDetailCard>
        </div>
    </div>;
}
