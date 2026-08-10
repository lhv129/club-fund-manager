<?php

namespace App\Domains\ClubFund\Services;

use App\Domains\ClubFund\Models\ClubFund;
use App\Domains\Transaction\Models\Transaction;
use Illuminate\Support\Facades\DB;

class ClubFundService
{
    /**
     * Ghi giao dịch và cập nhật số dư trong cùng transaction/row lock.
     */
    public function recordTransaction(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            DB::table('club_funds')->insertOrIgnore([
                'club_id' => $data['club_id'],
                'balance' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $fund = ClubFund::where('club_id', $data['club_id'])->lockForUpdate()->firstOrFail();
            $delta = $data['type'] === 'expense' ? -$data['amount'] : $data['amount'];
            $fund->increment('balance', $delta);
            $fund->refresh();

            // Giữ transaction.balance để tương thích API cũ, nhưng nguồn chuẩn là club_funds.
            $data['balance'] = $fund->balance;

            return Transaction::create($data);
        });
    }
}
