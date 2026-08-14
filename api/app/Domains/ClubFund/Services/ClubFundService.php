<?php

namespace App\Domains\ClubFund\Services;

use App\Domains\ClubFund\Repositories\ClubFundRepository;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Transaction\Repositories\TransactionRepository;
use Illuminate\Support\Facades\DB;

class ClubFundService
{
    public function __construct(
        protected ClubFundRepository $clubFundRepository,
        protected TransactionRepository $transactionRepository,
    ) {}

    /**
     * Ghi giao dịch và cập nhật số dư trong cùng transaction/row lock.
     */
    public function recordTransaction(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            $fund = $this->clubFundRepository->lockForClub((int) $data['club_id']);
            $delta = $data['type'] === 'expense' ? -$data['amount'] : $data['amount'];
            $fund = $this->clubFundRepository->applyDelta($fund, $delta);

            $data['balance'] = $fund->balance;

            return $this->transactionRepository->create($data);
        });
    }

    public function updateManagedTransaction(
        int $transactionId,
        int $clubId,
        array $data,
    ): Transaction {
        return DB::transaction(function () use ($transactionId, $clubId, $data): Transaction {
            $transaction = $this->transactionRepository->lockByIdForClub($transactionId, $clubId);

            $oldAmount = (float) $transaction->amount;
            $newAmount = (float) ($data['amount'] ?? $transaction->amount);
            $sign = $transaction->type === Transaction::TYPE_EXPENSE ? -1 : 1;
            $delta = ($newAmount - $oldAmount) * $sign;

            $fund = $this->clubFundRepository->lockForClub((int) $transaction->club_id);
            $fund = $this->clubFundRepository->applyDelta($fund, $delta);

            $data['balance'] = $fund->balance;

            return $this->transactionRepository->update($transaction, $data);
        });
    }

    public function deleteManagedTransaction(int $transactionId, int $clubId): void
    {
        DB::transaction(function () use ($transactionId, $clubId): void {
            $transaction = $this->transactionRepository->lockByIdForClub($transactionId, $clubId);
            $fund = $this->clubFundRepository->lockForClub((int) $transaction->club_id);
            $delta = $transaction->type === Transaction::TYPE_EXPENSE
                ? $transaction->amount
                : -$transaction->amount;

            $this->clubFundRepository->applyDelta($fund, $delta);
            $this->transactionRepository->deactivateAndDelete($transaction);
        });
    }
}
