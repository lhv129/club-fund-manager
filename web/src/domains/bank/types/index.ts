export interface Bank {
    id: number;
    code: string;
    name: string;
    short_name: string | null;
    bin: string | null;
    swift_code: string | null;
    logo: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string | null;
    updated_at: string | null;
}

export type BankFilters = {
    search: string;
    is_active: 0 | 1 | undefined;
};
