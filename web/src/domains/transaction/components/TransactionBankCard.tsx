"use client";

import { Landmark } from "lucide-react";
import { useTranslations } from "next-intl";
import CustomImage from "@/components/shared/media/CustomImage";
import type { BankAccount } from "@/domains/bankAccount/types/index";
import { CopyAction } from "@/components/shared/ui/button/copy/CopyAction";

interface TransactionBankCardProps {
    account: BankAccount | null;
}

/** "0123456789" -> "0123 4567 89" (display only — copy keeps raw value) */
const groupDigits = (value: string) => value.replace(/(.{4})(?=.)/g, "$1 ");

export function TransactionBankCard({ account }: TransactionBankCardProps) {
    const tt = useTranslations("transaction");

    if (!account) {
        return (
            <div className="flex items-center gap-3 py-3 text-foreground-muted">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground/[0.05]">
                    <Landmark className="h-5 w-5" />
                </span>
                <span className="text-sm">—</span>
            </div>
        );
    }

    const bankName = account.bank?.short_name ?? account.bank?.name ?? "—";

    return (
        <div className="space-y-5 pt-1">
            {/* Bank identity */}
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-border/70">
                    <CustomImage
                        src={account.bank?.logo}
                        alt={bankName}
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
                    <p className="truncate text-sm font-semibold text-foreground">
                        {bankName}
                    </p>
                    {account.bank?.name && account.bank.name !== bankName && (
                        <p className="truncate text-xs text-foreground-muted">
                            {account.bank.name}
                        </p>
                    )}
                </div>

                {account.bank?.code && (
                    <span className="ml-auto shrink-0 rounded-full bg-foreground/[0.05] px-2.5 py-0.5 font-mono text-[11px] font-medium text-foreground-muted">
                        {account.bank.code}
                    </span>
                )}
            </div>

            {/* Account number — the thing people actually copy */}
            <div>
                <p className="text-xs text-foreground-muted">{tt("accountNumber")}</p>
                <div className="mt-1 flex items-center gap-1">
                    <p className="min-w-0 break-all font-mono text-xl font-semibold tracking-wide text-foreground tabular-nums">
                        {account.account_number ? groupDigits(account.account_number) : "—"}
                    </p>
                    {account.account_number && (
                        <CopyAction value={account.account_number} />
                    )}
                </div>
            </div>

            {/* Account holder */}
            <div className="border-t border-dashed border-border/70 pt-4">
                <p className="text-xs text-foreground-muted">{tt("accountName")}</p>
                <p className="mt-1 truncate text-sm font-semibold uppercase tracking-wide text-foreground">
                    {account.account_name || "—"}
                </p>
            </div>
        </div>
    );
}
