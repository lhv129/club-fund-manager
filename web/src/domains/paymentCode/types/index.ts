export type PaymentCodeStatus = "pending" | "used" | "expired";

export interface PaymentCodeUser {
    id: number;
    fullname: string;
    email?: string;
    gender?: string | null;
}

export interface PaymentCodePeriod {
    id: number;
    year: number;
    month: number;
    male_amount?: string;
    female_amount?: string;
    exchange_male_amount?: string | null;
    exchange_female_amount?: string | null;
}

export interface PaymentCodeContribution {
    id: number;
    club_id?: number | null;
    user_id: number;
    period_id: number;
    transaction_id?: number | null;
    amount: string;
    status: string;
    paid_by?: string | null;
    payment_date?: string | null;
    user: PaymentCodeUser | null;
    period: PaymentCodePeriod | null;
}

export interface PaymentCode {
    id: number;
    monthly_contribution_id: number;
    payment_code: string;
    status: PaymentCodeStatus;
    expired_at: string | null;
    used_at: string | null;
    is_active: boolean;
    monthly_contribution: PaymentCodeContribution | null;
    created_at: string | null;
    updated_at: string | null;
}

export type PaymentCodeFilters = {
    monthly_contribution_id: number | undefined;
    status: PaymentCodeStatus | undefined;
};
