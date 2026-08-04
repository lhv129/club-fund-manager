<?php

namespace App\Domains\Webhook\Services;

use App\Domains\Transaction\Models\Transaction;
use App\Domains\Webhook\Repositories\SePayWebhookRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SePayWebhookService
{
    public function __construct(
        protected SePayWebhookRepository $repository
    ) {
        // Không cần parent::__construct()
    }

    public function handleWebhook(Request $request, string $token): Transaction
    {
        $config = $this->repository->findActiveConfigByToken($token);

        if (! $config) {
            throw new NotFoundHttpException('Webhook config not found or inactive.');
        }

        if (! $this->verifySignature($request, $config->webhook_secret)) {
            throw new HttpException(401, 'Invalid SePay signature.');
        }

        $payload = json_decode($request->getContent(), true);

        $this->repository->logWebhook(
            $request->headers->all(),
            $payload
        );

        return $this->repository->createTransaction($config, $payload);
    }

    private function verifySignature(Request $request, string $secret): bool
    {
        $signature = $request->header('X-SePay-Signature');
        $timestamp  = $request->header('X-SePay-Timestamp');

        if (empty($signature) || empty($timestamp)) {
            return false;
        }

        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $message  = $timestamp . '.' . $request->getContent();
        $expected = 'sha256=' . hash_hmac('sha256', $message, $secret);

        Log::info([
            'webhook_verify' => [
                'timestamp'           => $timestamp,
                'received_signature'  => $signature,
                'generated_signature' => $expected,
                'result'              => hash_equals($expected, $signature),
            ],
        ]);

        return hash_equals($expected, $signature);
    }
}
