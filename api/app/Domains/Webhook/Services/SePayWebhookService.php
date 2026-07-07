<?php

namespace App\Domains\Webhook\Services;

use App\Base\BaseService;
use App\Domains\Webhook\Repositories\SePayWebhookRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class SePayWebhookService extends BaseService
{
    protected object $repository;

    public function __construct(
        SePayWebhookRepository $repository
    ) {
        parent::__construct($repository);
    }

    public function handleWebhook(Request $request): void
    {
        if (! $this->verifySignature($request)) {
            throw new UnauthorizedHttpException('', 'Invalid SePay signature.');
        }

        $this->repository->logWebhook(
            $request->headers->all(),
            json_decode($request->getContent(), true)
        );
    }

    /**
     * Verify SePay Signature
     */
    private function verifySignature(Request $request): bool
    {
        $signature = $request->header('X-SePay-Signature');
        $timestamp = $request->header('X-SePay-Timestamp');

        if (
            empty($signature) ||
            empty($timestamp)
        ) {
            return false;
        }

        // Chống replay attack (5 phút)
        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $rawBody = $request->getContent();

        $message = $timestamp . '.' . $rawBody;

        $expectedSignature = 'sha256=' . hash_hmac(
            'sha256',
            $message,
            config('services.sepay.webhook_secret')
        );

        Log::info([
            'timestamp' => $timestamp,
            'received_signature' => $signature,
            'generated_signature' => $expectedSignature,
            'verify_result' => hash_equals($expectedSignature, $signature),
        ]);

        return hash_equals($expectedSignature, $signature);
    }
}
