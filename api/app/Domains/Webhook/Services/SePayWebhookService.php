<?php

namespace App\Domains\Webhook\Services;

use App\Base\BaseService;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\MemberPaymentCode\Services\PaymentMatchingService;
use App\Domains\Transaction\Services\TransactionService;
use App\Domains\Club\Repositories\ClubMemberRepository;
use App\Domains\Notification\Services\NotificationService;
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
    protected object $paymentMatchingService;

    public function __construct(
        SePayWebhookRepository    $repository,
        WebhookConfigRepository   $webhookConfigRepository,
        TransactionService        $transactionService,
        PaymentMatchingService    $paymentMatchingService,   // ← inject mới
        protected ClubMemberRepository $clubMemberRepository,
        protected NotificationService $notificationService,
    ) {
        parent::__construct($repository);
        $this->webhookConfigRepository = $webhookConfigRepository;
        $this->transactionService      = $transactionService;
        $this->paymentMatchingService  = $paymentMatchingService;
    }

    public function handleWebhook(Request $request, string $token): Transaction
    {
        $config = $this->webhookConfigRepository->findActiveConfigByToken($token);

        if (!$config) {
            throw new NotFoundHttpException('Webhook config not found or inactive.');
        }

        if (!$this->verifySignature($request, $config->webhook_secret)) {
            throw new HttpException(401, 'Invalid SePay signature.');
        }

        $payload = json_decode($request->getContent(), true);

        $this->repository->logWebhook($request->headers->all(), $payload);

        // Bước 1: Lưu transaction (không thay đổi)
        $transaction = $this->transactionService->createTransaction($config, $payload);

        // Bước 2: Tìm và settle payment code (nếu match)
        $this->paymentMatchingService->matchAndSettle($transaction);

        if ($transaction->type === Transaction::TYPE_EXPENSE) {
            $this->notifyClubMembersAboutExpense($transaction);
        }

        return $transaction;
    }

    private function notifyClubMembersAboutExpense(Transaction $transaction): void
    {
        $userIds = $this->clubMemberRepository->getActiveUserIds((int) $transaction->club_id);

        if ($userIds->isEmpty()) {
            return;
        }

        $this->notificationService->sendToMany(
            $userIds,
            'club_expense_created',
            [
                'transaction_id' => (int) $transaction->id,
                'amount' => (float) $transaction->amount,
                'description' => $transaction->description,
                'transaction_date' => $transaction->transaction_date?->toISOString(),
                'reference_code' => $transaction->reference_code,
            ],
            (int) $transaction->club_id,
        );
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
