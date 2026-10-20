<?php

namespace App\Domains\ClubFund\Services;

use App\Domains\ClubFund\Repositories\ClubFundRepository;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Transaction\Repositories\TransactionRepository;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ClubFundService
{
    public function __construct(
        protected ClubFundRepository $clubFundRepository,
        protected TransactionRepository $transactionRepository,
    ) {}

    /**
     * Ghi giao dịch và cập nhật số dư trong cùng transaction/row lock.
     * Giữ nguyên luồng tạo hiện tại.
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

    /**
     * Cập nhật giao dịch cash/manual và tính lại snapshot balance theo thứ tự id.
     * Fund lock được lấy trước ledger lock để đồng bộ thứ tự khóa với create/delete.
     */
    public function updateManagedTransaction(
        int $transactionId,
        int $clubId,
        array $data,
    ): Transaction {
        return DB::transaction(function () use ($transactionId, $clubId, $data): Transaction {
            $fund = $this->clubFundRepository->lockForClub($clubId);
            $ledger = $this->transactionRepository->lockLedgerForClub($clubId);

            $transaction = $ledger->first(
                fn(Transaction $row): bool => (int) $row->id === $transactionId,
            );

            if (! $transaction) {
                throw new ApiException(__('domains/transaction.not_found'), 404);
            }

            $oldType = (string) $transaction->type;
            $oldAmount = $transaction->amount;
            $newType = array_key_exists('type', $data)
                ? (string) $data['type']
                : $oldType;
            $newAmount = array_key_exists('amount', $data)
                ? $data['amount']
                : $oldAmount;

            $oldSignedAmount = $this->signedAmount($oldAmount, $oldType);
            $newSignedAmount = $this->signedAmount($newAmount, $newType);
            $delta = $this->subtractDecimal($newSignedAmount, $oldSignedAmount);

            if ($delta !== '0') {
                $fund = $this->clubFundRepository->applyDelta($fund, $delta);
            }

            // Derive the opening balance from the locked current fund and the full
            // active ledger, then rewrite snapshots starting at the edited row.
            $totalEffects = '0';

            foreach ($ledger as $row) {
                $rowType = (int) $row->id === $transactionId
                    ? $newType
                    : (string) $row->type;
                $rowAmount = (int) $row->id === $transactionId
                    ? $newAmount
                    : $row->amount;

                $totalEffects = $this->addDecimal(
                    $totalEffects,
                    $this->signedAmount($rowAmount, $rowType),
                );
            }

            $runningBalance = $this->subtractDecimal(
                (string) $fund->balance,
                $totalEffects,
            );
            $updatedTransaction = null;

            foreach ($ledger as $row) {
                $isTarget = (int) $row->id === $transactionId;
                $rowType = $isTarget ? $newType : (string) $row->type;
                $rowAmount = $isTarget ? $newAmount : $row->amount;
                $runningBalance = $this->addDecimal(
                    $runningBalance,
                    $this->signedAmount($rowAmount, $rowType),
                );

                if ((int) $row->id < $transactionId) {
                    continue;
                }

                $changes = ['balance' => $runningBalance];

                if ($isTarget) {
                    // Merge the caller's allowed fields, preserving explicit nulls.
                    $changes = array_merge($data, $changes);
                }

                $updated = $this->transactionRepository->update($row, $changes);

                if ($isTarget) {
                    $updatedTransaction = $updated;
                }
            }

            if (! $updatedTransaction) {
                throw new ApiException(__('domains/transaction.not_found'), 404);
            }

            return $this->transactionRepository->loadDetailRelations($updatedTransaction);
        }, 3);
    }

    /**
     * Delete keeps its public behavior; only lock order is aligned with ledger
     * updates so concurrent create/update/delete operations use fund -> ledger.
     */
    public function deleteManagedTransaction(int $transactionId, int $clubId): void
    {
        DB::transaction(function () use ($transactionId, $clubId): void {
            $fund = $this->clubFundRepository->lockForClub($clubId);
            $transaction = $this->transactionRepository->lockByIdForClub($transactionId, $clubId);
            $delta = $transaction->type === Transaction::TYPE_EXPENSE
                ? $transaction->amount
                : -$transaction->amount;

            $this->clubFundRepository->applyDelta($fund, $delta);
            $this->transactionRepository->deactivateAndDelete($transaction);
        });
    }

    private function signedAmount(mixed $amount, string $type): string
    {
        $amount = $this->normalizeDecimal($amount);

        return $type === Transaction::TYPE_EXPENSE
            ? $this->negateDecimal($amount)
            : $amount;
    }

    private function addDecimal(mixed $left, mixed $right): string
    {
        [$leftSign, $leftDigits, $leftScale] = $this->decimalParts($left);
        [$rightSign, $rightDigits, $rightScale] = $this->decimalParts($right);
        $scale = max($leftScale, $rightScale);
        $leftDigits .= str_repeat('0', $scale - $leftScale);
        $rightDigits .= str_repeat('0', $scale - $rightScale);

        if ($leftSign === $rightSign) {
            return $this->formatDecimal(
                $leftSign,
                $this->addUnsigned($leftDigits, $rightDigits),
                $scale,
            );
        }

        $comparison = $this->compareUnsigned($leftDigits, $rightDigits);

        if ($comparison === 0) {
            return '0';
        }

        if ($comparison > 0) {
            return $this->formatDecimal(
                $leftSign,
                $this->subtractUnsigned($leftDigits, $rightDigits),
                $scale,
            );
        }

        return $this->formatDecimal(
            $rightSign,
            $this->subtractUnsigned($rightDigits, $leftDigits),
            $scale,
        );
    }

    private function subtractDecimal(mixed $left, mixed $right): string
    {
        return $this->addDecimal($left, $this->negateDecimal($right));
    }

    private function negateDecimal(mixed $value): string
    {
        [$sign, $digits, $scale] = $this->decimalParts($value);

        return $this->formatDecimal($digits === '0' ? 1 : -$sign, $digits, $scale);
    }

    private function normalizeDecimal(mixed $value): string
    {
        [$sign, $digits, $scale] = $this->decimalParts($value);

        return $this->formatDecimal($sign, $digits, $scale);
    }

    /** @return array{int, string, int} sign, unsigned digits, decimal scale */
    private function decimalParts(mixed $value): array
    {
        if (! is_string($value) && ! is_int($value) && ! is_float($value)) {
            throw new InvalidArgumentException('Amount/balance must be numeric.');
        }

        if (is_float($value) && ! is_finite($value)) {
            throw new InvalidArgumentException('Amount/balance must be finite.');
        }

        $text = trim((string) $value);

        if (! preg_match('/^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/D', $text, $matches)) {
            throw new InvalidArgumentException('Amount/balance must be a decimal number.');
        }

        $integer = $matches[2] ?? '';
        $fraction = $matches[3] ?? '';

        if ($integer === '' && $fraction === '') {
            throw new InvalidArgumentException('Amount/balance must be a decimal number.');
        }

        $digits = ltrim($integer . $fraction, '0');
        $digits = $digits === '' ? '0' : $digits;
        $exponent = isset($matches[4]) && $matches[4] !== ''
            ? (int) $matches[4]
            : 0;
        $scale = strlen($fraction) - $exponent;

        if ($scale < 0) {
            $digits .= str_repeat('0', -$scale);
            $scale = 0;
        }

        while ($digits !== '0' && $scale > 0 && str_ends_with($digits, '0')) {
            $digits = substr($digits, 0, -1);
            $scale--;
        }

        $sign = ($matches[1] ?? '') === '-' && $digits !== '0' ? -1 : 1;

        return [$sign, $digits, $scale];
    }

    private function formatDecimal(int $sign, string $digits, int $scale): string
    {
        $digits = ltrim($digits, '0');

        if ($digits === '') {
            return '0';
        }

        if ($scale > 0) {
            $digits = str_pad($digits, $scale + 1, '0', STR_PAD_LEFT);
            $integer = substr($digits, 0, -$scale);
            $fraction = rtrim(substr($digits, -$scale), '0');
            $number = $fraction === '' ? $integer : $integer . '.' . $fraction;
        } else {
            $number = $digits;
        }

        return $sign < 0 ? '-' . $number : $number;
    }

    private function addUnsigned(string $left, string $right): string
    {
        $leftIndex = strlen($left) - 1;
        $rightIndex = strlen($right) - 1;
        $carry = 0;
        $result = '';

        while ($leftIndex >= 0 || $rightIndex >= 0 || $carry > 0) {
            $leftDigit = $leftIndex >= 0 ? ord($left[$leftIndex--]) - 48 : 0;
            $rightDigit = $rightIndex >= 0 ? ord($right[$rightIndex--]) - 48 : 0;
            $sum = $leftDigit + $rightDigit + $carry;
            $result = (string) ($sum % 10) . $result;
            $carry = intdiv($sum, 10);
        }

        return ltrim($result, '0') ?: '0';
    }

    /** Subtracts unsigned $right from unsigned $left; caller guarantees left >= right. */
    private function subtractUnsigned(string $left, string $right): string
    {
        $leftIndex = strlen($left) - 1;
        $rightIndex = strlen($right) - 1;
        $borrow = 0;
        $result = '';

        while ($leftIndex >= 0) {
            $leftDigit = ord($left[$leftIndex--]) - 48 - $borrow;
            $rightDigit = $rightIndex >= 0 ? ord($right[$rightIndex--]) - 48 : 0;

            if ($leftDigit < $rightDigit) {
                $leftDigit += 10;
                $borrow = 1;
            } else {
                $borrow = 0;
            }

            $result = (string) ($leftDigit - $rightDigit) . $result;
        }

        return ltrim($result, '0') ?: '0';
    }

    private function compareUnsigned(string $left, string $right): int
    {
        $left = ltrim($left, '0') ?: '0';
        $right = ltrim($right, '0') ?: '0';

        if (strlen($left) !== strlen($right)) {
            return strlen($left) <=> strlen($right);
        }

        return strcmp($left, $right) <=> 0;
    }
}
