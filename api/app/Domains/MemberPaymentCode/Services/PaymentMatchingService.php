<?php

namespace App\Domains\MemberPaymentCode\Services;

use App\Domains\MemberPaymentCode\Repositories\MemberPaymentCodeRepository;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Repositories\MonthlyContributionRepository;
use App\Domains\Transaction\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentMatchingService
{
    public function __construct(
        protected MemberPaymentCodeRepository $paymentCodeRepository,
        protected MonthlyContributionRepository $monthlyContributionRepository,
    ) {}

    /**
     * Tìm payment code trong description → nếu match thì settle.
     *
     * Guards:
     *   - transaction.type !== 'income'          → skip
     *   - code không tìm thấy / expired / used   → skip (log)
     *   - contribution.status !== 'pending'       → skip (log) ← guard mới
     */
    public function matchAndSettle(Transaction $transaction): ?MonthlyContribution
    {
        if ($transaction->type !== 'income') {
            return null;
        }

        $code = $this->extractCode($transaction->description ?? '');

        if (! $code) {
            Log::info('[PaymentMatching] No code extracted', [
                'transaction_id' => $transaction->id,
                'description' => $transaction->description,
            ]);

            return null;
        }

        return DB::transaction(function () use ($transaction, $code) {
            // lockForUpdate tránh race condition với concurrent webhooks
            $paymentCode = $this->paymentCodeRepository->findPendingByCode($code);

            if (! $paymentCode) {
                Log::info('[PaymentMatching] Code not found / expired / already used', [
                    'transaction_id' => $transaction->id,
                    'code' => $code,
                ]);

                return null;
            }

            $contribution = $paymentCode->monthlyContribution;

            // ── Guard: contribution phải đang pending ────────────────────────
            // Trường hợp: code cũ bị replay, hoặc admin đã settle tay trước
            if ($contribution->status !== 'pending') {
                Log::info('[PaymentMatching] Contribution already settled — skip', [
                    'transaction_id' => $transaction->id,
                    'contribution_id' => $contribution->id,
                    'contribution_status' => $contribution->status,
                    'code' => $code,
                ]);

                return null;
            }

            // 1. Đánh dấu payment code đã dùng
            $this->paymentCodeRepository->update($paymentCode, [
                'status' => 'used',
                'used_at' => now(),
            ]);

            // 2. Settle MonthlyContribution
            $contribution = $this->monthlyContributionRepository->update($contribution, [
                'transaction_id' => $transaction->id,
                'status' => 'paid',
                'paid_by' => 'bank',
                'payment_date' => $transaction->transaction_date ?? now(),
            ]);

            Log::info('[PaymentMatching] Settled successfully', [
                'transaction_id' => $transaction->id,
                'payment_code' => $code,
                'payment_code_id' => $paymentCode->id,
                'contribution_id' => $contribution->id,
            ]);

            return $contribution;
        });
    }

    /**
     * Extract 8-char code từ đầu description.
     * Chấp nhận "Y5REQVV8" hoặc "Y5REQVV8 nội dung khác" (đề phòng SePay đổi format).
     */
    private function extractCode(string $description): ?string
    {
        $trimmed = strtoupper(trim($description));

        if (preg_match('/^([A-Z0-9]{8})(\s|$)/', $trimmed, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
