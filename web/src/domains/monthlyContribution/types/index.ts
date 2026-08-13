// src/domains/monthlyContribution/types/index.ts
import type { FundPeriod } from "@/domains/fundPeriod/types";

/** Stub — đầy đủ type khai báo ở src/domains/transaction/types/index.ts */
import type { Transaction } from "@/domains/transaction/types";

/** Stub — đầy đủ type khai báo ở src/domains/paymentCode/types/index.ts */
import type { PaymentCode } from "@/domains/paymentCode/types";

// ─── Nested types ─────────────────────────────────────────────────────────────

export interface MonthlyContributionUser {
    id: number;
    fullname: string;
    email: string;
    gender: string | null;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ContributionStatus = "pending" | "paid" | "cancelled";
export type ContributionPaidBy = "bank" | "cash" | "manual";

// ─── Main entity ──────────────────────────────────────────────────────────────

export interface MonthlyContribution {
    id: number;
    club_id: number;
    user_id: number;
    period_id: number;
    transaction_id: number | null;
    amount: string;
    status: ContributionStatus;
    paid_by: ContributionPaidBy | null;
    payment_date: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
    user: MonthlyContributionUser;
    period: FundPeriod;
    transaction: Transaction | null;
    payment_code: PaymentCode | null;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export type MonthlyContributionFilters = {
    search: string;
    /** Lọc theo kỳ quỹ — cần select endpoint của fundPeriod để build dropdown */
    period_id: number | undefined;
    /** Lọc theo thành viên — cần select endpoint của member/user để build dropdown */
    user_id: number | undefined;
    status: ContributionStatus | undefined;
    paid_by: ContributionPaidBy | undefined;
};


export interface MonthlyContributionPaymentBank {
    id: number;
    code: string;
    name: string;
    short_name: string;
    logo: string;
}

export interface MonthlyContributionPaymentBankAccount {
    id: number;
    account_number: string;
    account_name: string;
    qr_image: string;
    is_default: boolean;
    bank: MonthlyContributionPaymentBank;
}

export interface MonthlyContributionPaymentQr {
    enabled: boolean;
    url: string;
}

export interface MonthlyContributionPayment {
    id: number;
    monthly_contribution_id: number;
    payment_code: string;
    status: string;
    expired_at: string;
    used_at: string | null;
    is_active: boolean;
    amount: string;
    bank_account: MonthlyContributionPaymentBankAccount;
    qr: MonthlyContributionPaymentQr;
}

export interface GenerateMonthlyContributionPaymentResponse {
    success: boolean;
    message: string;
    data: MonthlyContributionPayment;
}