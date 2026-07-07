<?php

namespace App\Domains\Webhook\Controllers;

use App\Base\BaseController;
use App\Domains\Webhook\Services\SePayWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;


class SePayWebhookController extends BaseController
{
    protected object $sePayWebhookService;

    public function __construct(
        SePayWebhookService $sePayWebhookService
    ) {
        $this->sePayWebhookService = $sePayWebhookService;
    }

    public function receive(Request $request): JsonResponse
    {
        try {

            $this->sePayWebhookService->handleWebhook($request);

            return response()->json([
                'success' => true,
                'message' => 'Webhook received successfully.',
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
