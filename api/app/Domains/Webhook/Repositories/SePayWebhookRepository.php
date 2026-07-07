<?php

namespace App\Domains\Webhook\Repositories;

use Illuminate\Support\Facades\Log;

class SePayWebhookRepository
{
    public function logWebhook(array $headers, ?array $payload): void
    {
        Log::channel('sepay_webhook')->info('================ SEPAY WEBHOOK ================');

        Log::channel('sepay_webhook')->info('Headers', $headers);

        Log::channel('sepay_webhook')->info('Payload', $payload ?? []);

        Log::channel('sepay_webhook')->info('===============================================');
    }
}
