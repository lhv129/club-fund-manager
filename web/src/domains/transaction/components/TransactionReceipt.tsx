"use client";

import { forwardRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatAmount, formatDateTime } from "@/utils";
import type { Transaction } from "@/domains/transaction/types";

interface TransactionReceiptProps {
    transaction: Transaction;
    clubName?: string;
}

/**
 * Printable receipt used ONLY for image / PDF export.
 * Uses fixed hex colors (not theme tokens) so dark mode never leaks into the file,
 * and no remote images (bank logos) so html-to-image never hits CORS.
 */
export const TransactionReceipt = forwardRef<HTMLDivElement, TransactionReceiptProps>(
    function TransactionReceipt({ transaction, clubName }, ref) {
        const locale = useLocale();
        const tt = useTranslations("transaction");
        const t = useTranslations("common");

        const isIncome = transaction.type === "income";
        const accent = isIncome ? "#059669" : "#e11d48";
        const accentSoft = isIncome ? "#ecfdf5" : "#fff1f2";

        const sourceLabel = transaction.source
            ? tt(`source${transaction.source.charAt(0).toUpperCase()}${transaction.source.slice(1)}`)
            : null;

        const bank = transaction.bank_account;
        const rows: Array<[string, string | null | undefined, boolean?]> = [
            [tt("transactionDate"), formatDateTime(transaction.transaction_date, locale)],
            [tt("source"), sourceLabel],
            [tt("referenceCode"), transaction.reference_code, true],
            [t("description"), transaction.description],
            [tt("bank"), bank?.bank ? `${bank.bank.short_name ?? bank.bank.name} (${bank.bank.code})` : null],
            [tt("accountNumber"), bank?.account_number, true],
            [tt("accountName"), bank?.account_name],
        ];

        return (
            <div
                ref={ref}
                style={{ width: 440, fontFamily: "inherit" }}
                className="bg-white p-8 text-[#0f172a]"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                            {tt("receiptTitle")}
                        </p>
                        {clubName && (
                            <p className="mt-1 truncate text-base font-semibold">{clubName}</p>
                        )}
                    </div>
                    <span
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ color: accent, backgroundColor: accentSoft }}
                    >
                        {tt(transaction.type)}
                    </span>
                </div>

                {/* Amount */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-[#64748b]">{tt("amount")}</p>
                    <p
                        className="mt-1 text-[40px] font-bold leading-none tracking-tight tabular-nums"
                        style={{ color: accent }}
                    >
                        {isIncome ? "+" : "−"}
                        {formatAmount(transaction.amount, "đ", locale)}
                    </p>
                </div>

                {/* Perforated divider */}
                <div className="relative my-8">
                    <div className="border-t-2 border-dashed border-[#e2e8f0]" />
                    <span className="absolute -left-11 -top-3 h-6 w-6 rounded-full bg-[#f1f5f9]" />
                    <span className="absolute -right-11 -top-3 h-6 w-6 rounded-full bg-[#f1f5f9]" />
                </div>

                {/* Details */}
                <dl>
                    {rows.map(([label, value, mono]) => (
                        <div
                            key={label}
                            className="flex items-start justify-between gap-6 border-b border-dashed border-[#e2e8f0] py-2.5 last:border-b-0"
                        >
                            <dt className="shrink-0 text-[13px] text-[#64748b]">{label}</dt>
                            <dd
                                className={`min-w-0 break-words text-right text-[13px] font-medium ${mono ? "font-mono" : ""}`}
                            >
                                {value || "—"}
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* Footer */}
                <p className="mt-8 text-center text-[11px] text-[#94a3b8]">
                    {tt("receiptGeneratedAt", { date: formatDateTime(new Date().toISOString(), locale) })}
                </p>
            </div>
        );
    },
);
