export type WebhookConfigType = "casso" | "sepay";

export interface WebhookConfigBankAccount {
    id: number;
    bank_id: number;
    account_number: string;
    account_name: string;
}

export interface WebhookConfig {
    id: number;
    club_id: number;
    bank_account_id: number;
    type: WebhookConfigType;
    webhook_url: string;
    is_verified: boolean;
    bank_account: WebhookConfigBankAccount | null;
    created_at: string | null;
    updated_at: string | null;
    /** Secret is accepted by create/update but intentionally omitted by list responses. */
    webhook_secret?: string;
}

export type WebhookConfigFilters = {
    search?: string;
    club_slug?: string;
    bank_account_id?: number | string;
    type?: WebhookConfigType | "";
    is_verified?: 0 | 1 | "";
};

export type WebhookConfigFormValues = {
    club_slug?: string;
    bank_account_id: string;
    type: WebhookConfigType;
    webhook_secret?: string;
};
