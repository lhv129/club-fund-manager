"use client";

import {
    ArrowLeft,
    CreditCard,
    Landmark,
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
import { useMonthlyContribution } from "@/domains/monthlyContribution/hooks/useMonthlyContributions";
import { ContributionHero } from "@/domains/monthlyContribution/components/ContributionHero";
import { TransactionBankCard } from "@/domains/transaction/components/TransactionBankCard";
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

            {[0, 1, 2].map((group) => (
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

export function MonthlyContributionDetailPageClient({
    id,
}: {
    id: number;
}) {
    const t = useTranslations("common");
    const tm = useTranslations("monthlyContribution");
    const tt = useTranslations("transaction");
    const locale = useLocale();
    const router = useRouter();
    const { club, slug } = useClub();

    const query = useMonthlyContribution(id, slug ?? "");
    const item = query.data?.data;

    if (!club || !slug) return null;

    const listHref = clubRoute(
        slug,
        CLUB_SUBROUTES.monthlyContributions,
    );
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
                        {tm("detailNotFound")}
                    </p>
                    <button
                        type="button"
                        onClick={goBack}
                        className="group mt-4 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        {tm("backToList")}
                    </button>
                </div>
            </div>
        );
    }

    const transaction = item.transaction;
    const bankAccount = transaction?.bank_account ?? null;
    const paymentCodeStatus = item.payment_code?.status;
    const periodLabel = tm("periodValue", {
        month: item.period.month,
        year: item.period.year,
    });

    const transactionSourceLabel =
        transaction?.source === "webhook"
            ? tt("sourceWebhook")
            : transaction?.source === "manual"
                ? tt("sourceManual")
                : transaction?.source === "cash"
                    ? tt("sourceCash")
                    : transaction?.source || null;

    return (
        <div className="w-full">
            <div className="mb-4 sm:mb-6">
                <Breadcrumb
                    navItems={CLUB_NAV_ITEMS(slug)}
                    homeHref={clubRoute(slug)}
                    extraItems={[{ label: tm("detailTitle") }]}
                />
            </div>

            <div className="mb-4 sm:mb-6">
                <ContributionHero
                    amount={formatAmount(item.amount, "đ", locale)}
                    period={periodLabel}
                    status={item.status}
                    statusLabel={tm(`status_${item.status}`)}
                />
            </div>

            <div className="space-y-8">
                {/* Pair sections into separate two-column rows.
                    A single grid for every section would add misplaced dividers
                    after the grid wraps to another row. */}
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border/60">
                    <DetailSection
                        icon={ReceiptText}
                        title={tm("contributionInformation")}
                        description={tm("contributionInformationDescription")}
                        className="lg:pr-10"
                    >
                        <dl>
                            <DetailRow
                                label={tm("amount")}
                                value={formatAmount(item.amount, "đ", locale)}
                                prominent
                            />
                            <DetailRow
                                label={tm("paidBy")}
                                value={
                                    item.paid_by
                                        ? tm(`paid_by_${item.paid_by}`)
                                        : "—"
                                }
                            />
                            <DetailRow
                                label={tm("paymentDate")}
                                value={formatDateTime(item.payment_date, locale)}
                            />
                        </dl>
                    </DetailSection>

                    <DetailSection
                        icon={UserRound}
                        title={tm("memberInformation")}
                        description={tm("memberInformationDescription")}
                        className="lg:pl-10"
                        delay={80}
                    >
                        <dl>
                            <DetailRow
                                label={tm("member")}
                                value={item.user?.fullname}
                                prominent
                            />
                            <DetailRow
                                label={tm("email")}
                                value={item.user?.email}
                            />
                            <DetailRow
                                label={tm("gender")}
                                value={
                                    item.user?.gender
                                        ? tm(`gender_${item.user.gender}`)
                                        : "—"
                                }
                            />
                        </dl>
                    </DetailSection>
                </div>

                <div className="grid gap-10 border-border/60 pt-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border/60">
                    <DetailSection
                        icon={WalletCards}
                        title={tm("periodInformation")}
                        description={tm("periodInformationDescription")}
                        className="lg:pr-10"
                        delay={80}
                    >
                        <dl>
                            <DetailRow
                                label={tm("period")}
                                value={periodLabel}
                                prominent
                            />

                            {item.user?.gender === "male" && (
                                <DetailRow
                                    label={tm("maleAmount")}
                                    value={formatAmount(
                                        item.period.male_amount,
                                        "đ",
                                        locale,
                                    )}
                                    prominent
                                />
                            )}

                            {item.user?.gender === "female" && (
                                <DetailRow
                                    label={tm("femaleAmount")}
                                    value={formatAmount(
                                        item.period.female_amount,
                                        "đ",
                                        locale,
                                    )}
                                    prominent
                                />
                            )}

                            <DetailRow
                                label={tm("lockStatus")}
                                value={
                                    <Badge
                                        variant={
                                            item.period.is_locked
                                                ? "locked"
                                                : "active"
                                        }
                                        title={
                                            item.period.is_locked
                                                ? tm("locked")
                                                : tm("unlocked")
                                        }
                                    />
                                }
                            />
                        </dl>
                    </DetailSection>

                    <DetailSection
                        icon={ScanLine}
                        title={tm("paymentCodeInformation")}
                        description={tm("paymentCodeInformationDescription")}
                        className="lg:pl-10"
                        delay={160}
                    >
                        <dl>
                            <DetailRow
                                label={tm("paymentCode")}
                                value={item.payment_code?.payment_code}
                                mono
                                prominent
                            />

                            <DetailRow
                                label={t("status")}
                                value={
                                    paymentCodeStatus ? (
                                        <Badge
                                            variant={
                                                paymentCodeStatus === "used"
                                                    ? "active"
                                                    : paymentCodeStatus === "expired"
                                                        ? "locked"
                                                        : "pending"
                                            }
                                            title={tm(
                                                `payment_code_${paymentCodeStatus}`,
                                            )}
                                        />
                                    ) : (
                                        "—"
                                    )
                                }
                            />

                            <DetailRow
                                label={tm("expiresAt")}
                                value={formatDateTime(
                                    item.payment_code?.expired_at,
                                    locale,
                                )}
                            />
                            <DetailRow
                                label={tm("usedAt")}
                                value={formatDateTime(
                                    item.payment_code?.used_at,
                                    locale,
                                )}
                            />
                        </dl>
                    </DetailSection>
                </div>

                {transaction && (
                    <div className="grid gap-10 border-border/60 pt-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border/60">
                        <DetailSection
                            icon={CreditCard}
                            title={tt("transactionInformation")}
                            description={tt("transactionInformationDescription")}
                            className="lg:pr-10"
                            delay={160}
                        >
                            <dl>
                                <DetailRow
                                    label={tt("transactionDate")}
                                    value={formatDateTime(
                                        transaction.transaction_date,
                                        locale,
                                    )}
                                />
                                <DetailRow
                                    label={tt("source")}
                                    value={transactionSourceLabel}
                                />
                                <DetailRow
                                    label={tt("referenceCode")}
                                    value={transaction.reference_code}
                                    copyValue={transaction.reference_code}
                                    mono
                                />
                                <DetailRow
                                    label={tt("amount")}
                                    value={formatAmount(
                                        transaction.amount,
                                        "đ",
                                        locale,
                                    )}
                                    prominent
                                />
                                {transaction.webhook_config?.type && (
                                    <DetailRow
                                        label={tt("webhookSource")}
                                        value={transaction.webhook_config.type.toUpperCase()}
                                    />
                                )}
                                <DetailRow
                                    label={t("description")}
                                    value={transaction.description}
                                />
                            </dl>
                        </DetailSection>

                        <DetailSection
                            icon={Landmark}
                            title={tt("bankInformation")}
                            description={tt("bankInformationDescription")}
                            className="lg:pl-10"
                            delay={240}
                        >
                            <TransactionBankCard account={bankAccount} />
                        </DetailSection>
                    </div>
                )}
            </div>
        </div>
    );
}
