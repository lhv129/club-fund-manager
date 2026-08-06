export interface Transaction {
    id: number;
    source: string;
    type: string;
    amount: string;
    reference_code: string | null;
    transaction_date: string | null;
}