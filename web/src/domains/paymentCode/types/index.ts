export interface PaymentCode {
    id: number;
    payment_code: string;
    status: string;
    expired_at: string | null;
    used_at: string | null;
}