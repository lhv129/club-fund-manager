// src/domains/transaction/types/index.ts

export type TransactionType = "income" | "expense";
export type TransactionSource = "webhook" | "manual" | "cash";

export interface Transaction {
    id: number;
    club_id: number;
    bank_account_id: number | null;
    source: TransactionSource | string | null;
    type: TransactionType;

    amount: string;
    balance: string | null;

    description: string | null;
    reference_code: string | null;

    sender_name: string | null;
    sender_account: string | null;

    transaction_date: string | null;

    is_active: boolean;
    sort_order: number;
    bank_account: {
        id: number;
        account_number: string;
        account_name: string;
        bank: {
            id: number;
            code: string;
            name: string;
            short_name: string | null;
            logo: string | null;
        } | null;
    } | null;
    webhook_config: {
        id: number;
        type: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface TransactionSelect {
    id: number;
    source?: TransactionSource;
    description: string | null;
    amount?: string;
    type?: TransactionType;
    transaction_date?: string | null;
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
