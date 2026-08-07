export interface BankAccount {
    id: number;
    club_id: number;
    bank_code: string | null;
    bank_name: string;
    account_number: string;
    account_name: string;
    qr_image: string | null;
    sort_order: number;
    is_active: boolean;
    is_default: boolean | null;
    created_at: string | null;
    updated_at: string | null;
}

export type BankAccountFilters = {
    search: string;
    is_active: 0 | 1 | undefined;
};