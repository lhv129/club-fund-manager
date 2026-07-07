<?php

namespace App\Domains\Webhook\Controllers;

use App\Base\BaseController;
use App\Domains\Webhook\Services\CassoWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CassoWebhookController extends BaseController
{
    protected object $service;
    
    public function __construct(
        CassoWebhookService $service
    ) {
        $this->service = $service;
    }

    public function receive(Request $request): JsonResponse
    {
        try {

            $this->service->handleWebhook($request);

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
