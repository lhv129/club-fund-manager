<?php

namespace App\Domains\Webhook\Repositories;

use Illuminate\Support\Facades\Log;

class CassoWebhookRepository
{
    public function logWebhook(array $headers, array $payload): void
    {
        Log::channel('casso_webhook')->info('================ CASSO WEBHOOK ================');

        Log::channel('casso_webhook')->info('Headers', $headers);

        Log::channel('casso_webhook')->info('Payload', $payload);

        Log::channel('casso_webhook')->info('===============================================');
    }
}
