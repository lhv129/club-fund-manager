<?php

namespace App\Domains\Webhook\Repositories;

use App\Domains\Transaction\Models\Transaction;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use Illuminate\Support\Facades\Log;

class SePayWebhookRepository
{
    /**
     * Tạo bản ghi Transaction từ payload SePay.
     */
    public function createTransaction(WebhookConfig $config, array $payload): Transaction
    {
        return Transaction::create([
            'club_id'          => $config->club_id,
            'bank_account_id'  => $config->bank_account_id,
            'webhook_config_id' => $config->id,
            'type'             => ($payload['transferType'] ?? 'in') === 'in' ? 'income' : 'expense',
            'amount'           => $payload['transferAmount'],
            'balance'          => $payload['accumulated'] ?? null,
            'description'      => $payload['content'] ?? $payload['description'] ?? '',
            'reference_code'   => $payload['referenceCode'] ?? null,
            'sender_name'      => null,   // SePay không trả sender_name
            'sender_account'   => null,   // SePay không trả sender_account
            'transaction_date' => $payload['transactionDate'],
            'raw_payload'      => json_encode($payload),
            'sort_order'       => 0,
            'is_active'        => true,
        ]);
    }
    /**
     * Log webhook thô vào file riêng.
     */
    public function logWebhook(array $headers, ?array $payload): void
    {
        Log::channel('sepay_webhook')->info('================ SEPAY WEBHOOK ================');
        Log::channel('sepay_webhook')->info('Headers', $headers);
        Log::channel('sepay_webhook')->info('Payload', $payload ?? []);
        Log::channel('sepay_webhook')->info('===============================================');
    }
}
