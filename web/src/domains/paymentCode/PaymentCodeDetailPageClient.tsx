"use client";

import { ArrowLeft, ReceiptText, ScanLine, UserRound, WalletCards } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/shared/ui/Badge";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { ContributionDetailCard } from "@/domains/monthlyContribution/components/ContributionDetailCard";
import { ContributionDetailRow } from "@/domains/monthlyContribution/components/ContributionDetailRow";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useClub } from "@/domains/club/hooks/useClub";
import { usePaymentCode } from "@/domains/paymentCode/hooks/usePaymentCodes";
import { useRouter } from "@/i18n/routing";
import { formatAmount, formatDateTime } from "@/utils";

export function PaymentCodeDetailPageClient({ code }: { code: string }) {
    const t = useTranslations("common"); const tp = useTranslations("paymentCode"); const locale = useLocale(); const router = useRouter(); const { club, slug } = useClub(); const query = usePaymentCode(code, slug ?? ""); const item = query.data?.data;
    if (!club || !slug) return null;
    const listHref = clubRoute(slug, CLUB_SUBROUTES.paymentCodes);
    if (query.isLoading) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} /><div className="h-40 animate-pulse rounded-2xl border border-border bg-background-subtle" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl border border-border bg-background-subtle" /><div className="h-64 animate-pulse rounded-2xl border border-border bg-background-subtle" /></div></div>;
    if (!item) return <div className="space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} /><div className="rounded-2xl border border-dashed border-border bg-background-subtle py-14 text-center text-sm text-foreground-muted">{tp("detailNotFound")}</div></div>;
    const contribution = item.monthly_contribution;
    return <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6"><Breadcrumb navItems={CLUB_NAV_ITEMS(slug)} homeHref={clubRoute(slug)} extraItems={[{ label: item.payment_code }]} /><button type="button" onClick={() => router.push(listHref as never)} className="group inline-flex min-h-10 items-center gap-2 px-1 text-sm font-medium text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />{tp("backToList")}</button>
        <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.10] via-background to-background px-5 py-5 shadow-sm sm:px-7 sm:py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ScanLine className="h-6 w-6" /></span><div className="min-w-0"><p className="text-xs font-medium text-foreground-muted">{tp("code")}</p><h1 className="mt-1 break-all font-mono text-2xl font-bold tracking-[0.14em] text-foreground sm:text-3xl">{item.payment_code}</h1></div></div><Badge variant={item.status === "used" ? "active" : item.status === "expired" ? "locked" : "pending"} title={tp(item.status)} /></div></section>
        <div className="grid gap-5 lg:grid-cols-2"><ContributionDetailCard icon={ScanLine} title={tp("codeInformation")} description={tp("codeInformationDescription")}><dl><ContributionDetailRow label={tp("code")} value={item.payment_code} mono prominent /><ContributionDetailRow label={tp("expiresAt")} value={formatDateTime(item.expired_at, locale)} /><ContributionDetailRow label={tp("usedAt")} value={formatDateTime(item.used_at, locale)} /></dl></ContributionDetailCard>
        <ContributionDetailCard icon={ReceiptText} title={tp("contributionInformation")} description={tp("contributionInformationDescription")} delay="short"><dl><ContributionDetailRow label={tp("amount")} value={formatAmount(contribution?.amount ?? "0", "đ", locale)} prominent /><ContributionDetailRow label={tp("paymentMethod")} value={contribution?.paid_by || "—"} /><ContributionDetailRow label={tp("paymentDate")} value={formatDateTime(contribution?.payment_date, locale)} /><ContributionDetailRow label={t("status")} value={contribution?.status} /></dl></ContributionDetailCard>
        <ContributionDetailCard icon={UserRound} title={tp("memberInformation")} description={tp("memberInformationDescription")}><dl><ContributionDetailRow label={tp("member")} value={contribution?.user?.fullname} prominent /><ContributionDetailRow label={tp("email")} value={contribution?.user?.email} /><ContributionDetailRow label={tp("gender")} value={contribution?.user?.gender} /></dl></ContributionDetailCard>
        <ContributionDetailCard icon={WalletCards} title={tp("periodInformation")} description={tp("periodInformationDescription")} delay="short"><dl><ContributionDetailRow label={tp("period")} value={contribution?.period ? tp("periodValue", { month: contribution.period.month, year: contribution.period.year }) : "—"} prominent /><ContributionDetailRow label={tp("maleAmount")} value={formatAmount(contribution?.period?.male_amount ?? "0", "đ", locale)} /><ContributionDetailRow label={tp("femaleAmount")} value={formatAmount(contribution?.period?.female_amount ?? "0", "đ", locale)} /></dl></ContributionDetailCard></div>
    </div>;
}
