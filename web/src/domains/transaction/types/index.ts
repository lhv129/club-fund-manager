// src/domains/transaction/types/index.ts

export type TransactionType = "income" | "expense";
export type TransactionSource = "manual" | "cash";

export interface Transaction {
    id: number;

    bank_account_id: number | null;

    source: string | null;
    type: TransactionType;

    amount: string;
    balance: string | null;

    description: string | null;
    reference_code: string | null;

    sender_name: string | null;
    sender_account: string | null;

    transaction_date: string | null;

    is_active: boolean;

    created_at: string | null;
    updated_at: string | null;
}

export interface TransactionSelect {
    id: number;
    description: string | null;
    created_at: string | null;
}

export type TransactionFilters = {
    search: string;
    bank_account_id: number | undefined;
    type: TransactionType | undefined;
    is_active: 0 | 1 | undefined;
    from_date: string | undefined;
    to_date: string | undefined;
};