"use client";

import { ArrowLeft, CreditCard, Landmark, ReceiptText, ScanLine, UserRound, WalletCards } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/shared/ui/Badge";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useClub } from "@/domains/club/hooks/useClub";
import { useMonthlyContribution } from "@/domains/monthlyContribution/hooks/useMonthlyContributions";
import { ContributionDetailCard } from "@/domains/monthlyContribution/components/ContributionDetailCard";
import { ContributionDetailRow } from "@/domains/monthlyContribution/components/ContributionDetailRow";
import { ContributionHero } from "@/domains/monthlyContribution/components/ContributionHero";
import { useRouter } from "@/i18n/routing";
import { formatAmount, formatDateTime } from "@/utils";

function DetailSkeleton() {
    return <div className="space-y-5"><div className="h-36 animate-pulse rounded-2xl border border-border bg-background-subtle" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl border border-border bg-background-subtle" /><div className="h-80 animate-pulse rounded-2xl border border-border bg-background-subtle" /></div></div>;
}

export function MonthlyContributionDetailPageClient({ id }: { id: number }) {
    const t = useTranslations("common");
    const tm = useTranslations("monthlyContribution");
    const locale = useLocale();
    const router = useRouter();
    const { club, slug } = useClub();
    const query = useMonthlyContribution(id, slug ?? "");
    const item = query.data?.data;

    if (!club || !slug) return null;
    const listHref = clubRoute(slug, CLUB_SUBROUTES.monthlyContributions);
    if (query.isLoading) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} /><DetailSkeleton /></div>;
    if (!item) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} /><div className="rounded-2xl border border-dashed border-border bg-background-subtle px-5 py-14 text-center text-sm text-foreground-muted">{tm("detailNotFound")}</div></div>;

    const paymentCodeStatus = item.payment_code?.status;
    const transaction = item.transaction;
    const bankAccount = transaction?.bank_account;

    return <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
        <Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} extraItems={[{ label: tm("detailTitle") }]} />
        <button type="button" onClick={() => router.push(listHref as never)} className="group inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />{tm("backToList")}</button>

        <ContributionHero amount={formatAmount(item.amount, "đ", locale)} period={tm("periodValue", { month: item.period.month, year: item.period.year })} status={item.status} statusLabel={tm(`status_${item.status}`)} />

        <div className="grid gap-5 lg:grid-cols-2">
            <ContributionDetailCard icon={ReceiptText} title={tm("contributionInformation")} description={tm("contributionInformationDescription")}>
                <dl><ContributionDetailRow label={tm("amount")} value={formatAmount(item.amount, "đ", locale)} prominent /><ContributionDetailRow label={tm("paidBy")} value={item.paid_by ? tm(`paid_by_${item.paid_by}`) : "—"} /><ContributionDetailRow label={tm("paymentDate")} value={formatDateTime(item.payment_date, locale)} /></dl>
            </ContributionDetailCard>

            <ContributionDetailCard icon={UserRound} title={tm("memberInformation")} description={tm("memberInformationDescription")} delay="short">
                <dl><ContributionDetailRow label={tm("member")} value={item.user?.fullname} prominent /><ContributionDetailRow label={tm("email")} value={item.user?.email} /><ContributionDetailRow label={tm("gender")} value={item.user?.gender ? tm(`gender_${item.user.gender}`) : "—"} /></dl>
            </ContributionDetailCard>

            <ContributionDetailCard icon={WalletCards} title={tm("periodInformation")} description={tm("periodInformationDescription")}>
                <dl><ContributionDetailRow label={tm("period")} value={tm("periodValue", { month: item.period.month, year: item.period.year })} prominent />{item.user?.gender === "male" && <ContributionDetailRow label={tm("maleAmount")} value={formatAmount(item.period.male_amount, "đ", locale)} prominent />}{item.user?.gender === "female" && <ContributionDetailRow label={tm("femaleAmount")} value={formatAmount(item.period.female_amount, "đ", locale)} prominent />}<ContributionDetailRow label={tm("lockStatus")} value={<Badge variant={item.period.is_locked ? "locked" : "active"} title={item.period.is_locked ? tm("locked") : tm("unlocked")} />} /></dl>
            </ContributionDetailCard>

            <ContributionDetailCard icon={ScanLine} title={tm("paymentCodeInformation")} description={tm("paymentCodeInformationDescription")} delay="short">
                <dl><ContributionDetailRow label={tm("paymentCode")} value={item.payment_code?.payment_code} mono prominent /><ContributionDetailRow label={t("status")} value={paymentCodeStatus ? <Badge variant={paymentCodeStatus === "used" ? "active" : paymentCodeStatus === "expired" ? "locked" : "pending"} title={tm(`payment_code_${paymentCodeStatus}`)} /> : "—"} /><ContributionDetailRow label={tm("expiresAt")} value={formatDateTime(item.payment_code?.expired_at, locale)} /><ContributionDetailRow label={tm("usedAt")} value={formatDateTime(item.payment_code?.used_at, locale)} /></dl>
            </ContributionDetailCard>

            {transaction && <ContributionDetailCard icon={CreditCard} title={tm("transactionInformation")} description={tm("transactionInformationDescription")} className="lg:col-span-2" delay="medium">
                <div className="grid lg:grid-cols-2 lg:gap-x-10"><dl><ContributionDetailRow label={tm("referenceCode")} value={transaction.reference_code} mono /><ContributionDetailRow label={tm("transactionAmount")} value={formatAmount(transaction.amount, "đ", locale)} prominent /><ContributionDetailRow label={tm("transactionDate")} value={formatDateTime(transaction.transaction_date, locale)} /><ContributionDetailRow label={tm("transactionSource")} value={transaction.source || "—"} /><ContributionDetailRow label={t("description")} value={transaction.description} /></dl><dl className="border-t border-border lg:border-l lg:border-t-0 lg:pl-10"><ContributionDetailRow label={tm("bank")} value={bankAccount?.bank ? <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4 text-foreground-muted" />{bankAccount.bank.name} ({bankAccount.bank.code})</span> : "—"} /><ContributionDetailRow label={tm("accountNumber")} value={bankAccount?.account_number} mono /><ContributionDetailRow label={tm("accountName")} value={bankAccount?.account_name} /></dl></div>
            </ContributionDetailCard>}
        </div>
    </div>;
}
