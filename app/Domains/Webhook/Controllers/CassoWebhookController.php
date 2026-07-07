<?php

namespace App\Domains\Webhook\Controllers;

use App\Base\BaseController;
use App\Domains\Webhook\Services\CassoWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CassoWebhookController extends BaseController
{
    public function __construct(
        protected CassoWebhookService $cassoWebhookService
    ) {}

    public function receive(Request $request): JsonResponse
    {
        try {

            $this->cassoWebhookService->handleWebhook($request);

            return response()->json([
                'success' => true,
                'message' => 'Webhook received'
            ]);
        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
