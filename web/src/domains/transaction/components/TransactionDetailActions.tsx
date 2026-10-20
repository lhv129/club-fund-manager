"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn, formatAmount, formatDateTime } from "@/utils";
import type { Transaction } from "@/domains/transaction/types";
import { ShareAction } from "@/components/shared/ui/button/ShareAction";
import { ImageDownloadAction } from "@/components/shared/ui/button/dowloadImage/ImageDownloadAction";
import { PdfDownloadAction } from "@/components/shared/ui/button/PdfDownloadAction";
import { TransactionReceipt } from "@/domains/transaction/components/TransactionReceipt";

interface TransactionDetailActionsProps {
    transaction: Transaction;
    clubName?: string;
    className?: string;
}

/** Transaction-specific composition of generic shared UI actions. */
export function TransactionDetailActions({
    transaction,
    clubName,
    className,
}: TransactionDetailActionsProps) {
    const locale = useLocale();
    const tt = useTranslations("transaction");
    const receiptRef = useRef<HTMLDivElement>(null);
    const fileBase = `${tt("receiptFileName")}-${transaction.reference_code || transaction.id}`;
    const shareText = tt("shareText", {
        type: tt(transaction.type),
        amount: formatAmount(transaction.amount, "đ", locale),
        date: formatDateTime(transaction.transaction_date, locale),
    });

    return (
        <>
            <div className={cn("flex flex-wrap items-center gap-2", className)}>
                <div
                    role="group"
                    aria-label={tt("downloadReceipt")}
                    className="inline-flex items-center divide-x divide-border/70 overflow-hidden rounded-full ring-1 ring-border/70"
                >
                    <ImageDownloadAction
                        elementRef={receiptRef}
                        fileName={`${fileBase}.png`}
                        label={tt("downloadImageShort")}
                        title={tt("downloadImage")}
                        failureLabel={tt("actionFailed")}
                    />
                    <PdfDownloadAction
                        elementRef={receiptRef}
                        fileName={`${fileBase}.pdf`}
                        label="PDF"
                        title={tt("downloadPdf")}
                        failureLabel={tt("actionFailed")}
                    />
                </div>

                <ShareAction
                    title={tt("detailTitle")}
                    text={shareText}
                    getUrl={() => window.location.href}
                    labels={{
                        idle: tt("share"),
                        done: tt("shareDone"),
                        error: tt("actionFailed"),
                    }}
                />
            </div>

            {/* The captured element itself must not be positioned off-screen. */}
            <div aria-hidden className="pointer-events-none fixed -left-[10000px] top-0">
                <TransactionReceipt
                    ref={receiptRef}
                    transaction={transaction}
                    clubName={clubName}
                />
            </div>
        </>
    );
}
