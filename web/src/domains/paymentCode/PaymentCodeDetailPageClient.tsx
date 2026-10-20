"use client";

import {
    ArrowLeft,
    ReceiptText,
    ScanLine,
    UserRound,
    WalletCards,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/shared/ui/Badge";
import { DetailRow } from "@/components/shared/ui/DetailRow";
import { DetailSection } from "@/components/shared/ui/DetailSection";
import { Breadcrumb } from "@/components/shared/layout/Breadcrumb";
import { CLUB_NAV_ITEMS } from "@/components/club/layout/club-nav-config";
import { clubRoute, CLUB_SUBROUTES } from "@/constants";
import { useClub } from "@/domains/club/hooks/useClub";
import { usePaymentCode } from "@/domains/paymentCode/hooks/usePaymentCodes";
import { useRouter } from "@/i18n/routing";
import { formatAmount, formatDateTime } from "@/utils";

const Skeleton = ({ className }: { className: string }) => (
    <div
        className={`animate-pulse rounded-full bg-foreground/[0.06] ${className}`}
    />
);

function DetailSectionSkeleton() {
    return (
        <div className="space-y-5 px-1 py-1">
            <Skeleton className="h-5 w-40" />
            {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex justify-between gap-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))}
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true">
            <div className="space-y-4 rounded-3xl bg-foreground/[0.03] px-5 py-8 sm:px-8">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-11 w-64" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>

            {[0, 1].map((group) => (
                <div
                    key={group}
                    className={`grid gap-10 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border/60 ${group > 0 ? "border-t border-border/60 pt-8" : ""
                        }`}
                >
                    <DetailSectionSkeleton />
                    <DetailSectionSkeleton />
                </div>
            ))}
        </div>
    );
}

export function PaymentCodeDetailPageClient({
    code,
}: {
    code: string;
}) {
    const t = useTranslations("common");
    const tp = useTranslations("paymentCode");
    const locale = useLocale();
    const router = useRouter();
    const { club, slug } = useClub();

    const query = usePaymentCode(code, slug ?? "");
    const item = query.data?.data;

    if (!club || !slug) return null;

    const listHref = clubRoute(slug, CLUB_SUBROUTES.paymentCodes);
    const goBack = () => router.push(listHref as never);

    if (query.isLoading) {
        return (
            <div className="w-full">
                <Breadcrumb
                    navItems={CLUB_NAV_ITEMS(slug)}
                    homeHref={clubRoute(slug)}
                />
                <DetailSkeleton />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="w-full">
                <Breadcrumb
                    navItems={CLUB_NAV_ITEMS(slug)}
                    homeHref={clubRoute(slug)}
                />
                <div className="flex flex-col items-center px-6 py-16 text-center">
                    <p className="text-sm text-foreground-muted">
                        {tp("detailNotFound")}
                    </p>
                    <button
                        type="button"
                        onClick={goBack}
                        className="group mt-4 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        {tp("backToList")}
                    </button>
                </div>
            </div>
        );
    }

    const contribution = item.monthly_contribution;

    return (
        <div className="w-full">
            <div className="mb-4 sm:mb-6">
                <Breadcrumb
                    navItems={CLUB_NAV_ITEMS(slug)}
                    homeHref={clubRoute(slug)}
                    extraItems={[{ label: item.payment_code }]}
                />
            </div>

            <section className="relative isolate mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/[0.08] via-background to-background px-5 py-6 ring-1 ring-inset ring-primary/15 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:mb-6 sm:px-8 sm:py-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
                />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <ScanLine className="h-6 w-6" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground-muted">
                                {tp("code")}
                            </p>
                            <h1 className="mt-1 break-all font-mono text-2xl font-bold tracking-[0.14em] text-foreground sm:text-3xl">
                                {item.payment_code}
                            </h1>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center border-t border-border/60 pt-4 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                        <Badge
                            variant={
                                item.status === "used"
                                    ? "active"
                                    : item.status === "expired"
                                        ? "locked"
                                        : "pending"
                            }
                            title={tp(item.status)}
                        />
                    </div>
                </div>
            </section>

            <div className="space-y-8">
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border/60">
                    <DetailSection
                        icon={ScanLine}
                        title={tp("codeInformation")}
                        description={tp("codeInformationDescription")}
                        className="lg:pr-10"
                    >
                        <dl>
                            <DetailRow
                                label={tp("code")}
                                value={item.payment_code}
                                mono
                                prominent
                            />
                            <DetailRow
                                label={tp("expiresAt")}
                                value={formatDateTime(item.expired_at, locale)}
                            />
                            <DetailRow
                                label={tp("usedAt")}
                                value={formatDateTime(item.used_at, locale)}
                            />
                        </dl>
                    </DetailSection>

                    <DetailSection
                        icon={ReceiptText}
                        title={tp("contributionInformation")}
                        description={tp("contributionInformationDescription")}
                        className="lg:pl-10"
                        delay={80}
                    >
                        <dl>
                            <DetailRow
                                label={tp("amount")}
                                value={formatAmount(
                                    contribution?.amount ?? "0",
                                    "đ",
                                    locale,
                                )}
                                prominent
                            />
                            <DetailRow
                                label={tp("paymentMethod")}
                                value={contribution?.paid_by || "—"}
                            />
                            <DetailRow
                                label={tp("paymentDate")}
                                value={formatDateTime(
                                    contribution?.payment_date,
                                    locale,
                                )}
                            />
                            <DetailRow
                                label={t("status")}
                                value={contribution?.status}
                            />
                        </dl>
                    </DetailSection>
                </div>

                <div className="grid gap-10 border-border/60 pt-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border/60">
                    <DetailSection
                        icon={UserRound}
                        title={tp("memberInformation")}
                        description={tp("memberInformationDescription")}
                        className="lg:pr-10"
                        delay={80}
                    >
                        <dl>
                            <DetailRow
                                label={tp("member")}
                                value={contribution?.user?.fullname}
                                prominent
                            />
                            <DetailRow
                                label={tp("email")}
                                value={contribution?.user?.email}
                            />
                            <DetailRow
                                label={tp("gender")}
                                value={contribution?.user?.gender}
                            />
                        </dl>
                    </DetailSection>

                    <DetailSection
                        icon={WalletCards}
                        title={tp("periodInformation")}
                        description={tp("periodInformationDescription")}
                        className="lg:pl-10"
                        delay={160}
                    >
                        <dl>
                            <DetailRow
                                label={tp("period")}
                                value={
                                    contribution?.period
                                        ? tp("periodValue", {
                                            month: contribution.period.month,
                                            year: contribution.period.year,
                                        })
                                        : "—"
                                }
                                prominent
                            />
                            <DetailRow
                                label={tp("maleAmount")}
                                value={formatAmount(
                                    contribution?.period?.male_amount ?? "0",
                                    "đ",
                                    locale,
                                )}
                            />
                            <DetailRow
                                label={tp("femaleAmount")}
                                value={formatAmount(
                                    contribution?.period?.female_amount ?? "0",
                                    "đ",
                                    locale,
                                )}
                            />
                        </dl>
                    </DetailSection>
                </div>
            </div>
        </div>
    );
}