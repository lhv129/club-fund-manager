<?php

namespace App\Domains\Webhook\Services;

use App\Base\BaseService;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Transaction\Services\TransactionService;
use App\Domains\Webhook\Repositories\SePayWebhookRepository;
use App\Domains\WebhookConfig\Repositories\WebhookConfigRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SePayWebhookService extends BaseService
{
    protected object $repository;
    protected object $webhookConfigRepository;

    protected object $transactionService;

    public function __construct(
        SePayWebhookRepository $repository,
        WebhookConfigRepository $webhookConfigRepository,

        TransactionService $transactionService
    ) {
        parent::__construct($repository);
        $this->webhookConfigRepository = $webhookConfigRepository;
        $this->transactionService = $transactionService;
    }

    public function handleWebhook(Request $request, string $token): Transaction
    {
        $config = $this->webhookConfigRepository->findActiveConfigByToken($token);

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

        return $this->transactionService->createTransaction($config, $payload);
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
