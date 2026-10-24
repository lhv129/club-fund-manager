"use client";

import { ArrowLeft, Landmark, ReceiptText, SearchX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useClub } from "@/domains/club/hooks/useClub";
import { useTransaction } from "@/domains/transaction/hooks/useTransactions";
import { TransactionBankCard } from "@/domains/transaction/components/TransactionBankCard";
import { TransactionDetailHero } from "@/domains/transaction/components/TransactionDetailHero";
import { DetailRow } from "@/components/shared/ui/DetailRow";
import { DetailSection } from "@/components/shared/ui/DetailSection";
import { TransactionDetailActions } from "@/domains/transaction/components/TransactionDetailActions";
import { useRouter } from "@/i18n/routing";
import { formatDateTime } from "@/utils";

const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse rounded-full bg-foreground/[0.06] ${className}`} />
);

export function TransactionDetailPageClient({ id }: { id: number }) {
    const locale = useLocale();
    const t = useTranslations("common");
    const tt = useTranslations("transaction");
    const router = useRouter();
    const { club, slug } = useClub();
    const query = useTransaction(slug ?? "", id);
    const item = query.data?.data;

    if (!club || !slug) return null;

    const listHref = clubRoute(slug, CLUB_SUBROUTES.transactions);
    const goBack = () => router.push(listHref as never);

    const breadcrumb = (
        <Breadcrumb
            navItems={CLUB_NAV_ITEMS(slug)}
            homeHref={clubRoute(slug)}
            extraItems={item ? [{ label: tt("detailTitle") }] : undefined}
        />
    );

    const backButton = (
        <button
            type="button"
            onClick={goBack}
            className="group -ml-2 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {tt("backToList")}
        </button>
    );

    /* ------------------------------ Loading ------------------------------ */
    if (query.isLoading) {
        return (
            <div className="w-full" aria-busy="true">
                {breadcrumb}
                <div className="space-y-4 rounded-3xl bg-foreground/[0.03] px-5 py-8 sm:px-8">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-11 w-64" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>
                <div className="grid gap-10 px-1 lg:grid-cols-2">
                    {[0, 1].map((col) => (
                        <div key={col} className="space-y-5">
                            <Skeleton className="h-5 w-40" />
                            {[0, 1, 2, 3].map((row) => (
                                <div key={row} className="flex justify-between gap-6">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ----------------------------- Not found ----------------------------- */
    if (!item) {
        return (
            <div className="w-full">
                {breadcrumb}
                <div className="flex flex-col items-center px-6 py-16 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/[0.05] text-foreground-muted">
                        <SearchX className="h-6 w-6" />
                    </span>
                    <p className="mt-4 max-w-sm text-sm text-foreground-muted">{tt("detailNotFound")}</p>
                    <div className="mt-4">{backButton}</div>
                </div>
            </div>
        );
    }

    /* ------------------------------- Detail ------------------------------ */
    const sourceLabel = item.source
        ? tt(`source${item.source.charAt(0).toUpperCase()}${item.source.slice(1)}`)
        : null;

    return (
        <div className="w-full">

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mt-6">
                {breadcrumb}
                <TransactionDetailActions transaction={item} />
            </div>

            <div className="mb-4 sm:mb-6">
                <TransactionDetailHero transaction={item} />
            </div>

            {/* One calm surface, two columns split by a hairline — no stacked boxes */}
            <div className="grid gap-10 px-1 sm:px-2 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border/60">
                <DetailSection
                    icon={ReceiptText}
                    title={tt("transactionInformation")}
                    description={tt("transactionInformationDescription")}
                    className="lg:pr-10"
                    delay={80}
                >
                    <dl>
                        <DetailRow
                            label={tt("transactionDate")}
                            value={formatDateTime(item.transaction_date, locale)}
                        />
                        <DetailRow label={tt("source")} value={sourceLabel} />
                        <DetailRow
                            label={tt("referenceCode")}
                            value={item.reference_code}
                            copyValue={item.reference_code}
                            mono
                        />
                        <DetailRow
                            label={tt("webhookSource")}
                            value={item.webhook_config?.type?.toUpperCase()}
                        />
                        <DetailRow label={t("description")} value={item.description} />
                    </dl>
                </DetailSection>

                <DetailSection
                    icon={Landmark}
                    title={tt("bankInformation")}
                    description={tt("bankInformationDescription")}
                    className="lg:pl-10"
                    delay={160}
                >
                    <TransactionBankCard account={item.bank_account ?? null} />
                </DetailSection>
            </div>
        </div>
    );
}
