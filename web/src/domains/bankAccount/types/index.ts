export interface BankAccount {
    id: number;
    club_id: number;
    bank_id: number;
    bank: {
        id: number;
        code: string;
        name: string;
        logo: string | null;
    } | null;
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
