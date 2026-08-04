<?php

namespace App\Domains\Webhook\Controllers;

use App\Base\BaseController;
use App\Domains\Webhook\Services\SePayWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SePayWebhookController extends BaseController
{
    public function __construct(
        protected SePayWebhookService $service
    ) {}

    public function receive(Request $request, string $token): JsonResponse
    {
        try {
            $transaction = $this->service->handleWebhook($request, $token);

            return response()->json([
                'success' => true,
                'message' => 'Webhook received successfully.',
                'data'    => ['transaction_id' => $transaction->id],
            ], Response::HTTP_OK);
        } catch (\Throwable $e) {
            // Sửa: kiểm tra method tồn tại trước khi gọi
            $statusCode = method_exists($e, 'getStatusCode')
                ? $e->getStatusCode()
                : Response::HTTP_INTERNAL_SERVER_ERROR;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}
