import type { Translation } from "@/domains/club/types";

export interface FundPeriod {
    id: number;
    club_id: number;
    year: number;
    month: number;
    male_amount: string;
    female_amount: string;
    exchange_male_amount: string;
    exchange_female_amount: string;
    is_locked: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string | null;
    updated_at: string | null;
    deleted_at?: string | null;
    translation?: Translation;    // list endpoint
    translations?: Translation[]; // show/edit endpoint
}

export type FundPeriodFilters = {
    search: string;
    year?: number;
    month?: number;
};
