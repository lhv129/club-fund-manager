<?php

namespace App\Domains\ClubFund\Repositories;

use App\Base\BaseRepository;
use App\Domains\ClubFund\Models\ClubFund;
use Illuminate\Support\Facades\DB;

class ClubFundRepository extends BaseRepository
{
    public function __construct(ClubFund $model)
    {
        parent::__construct($model);
    }

    public function lockForClub(int $clubId): ClubFund
    {
        DB::table('club_funds')->insertOrIgnore([
            'club_id' => $clubId,
            'balance' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->model
            ->newQuery()
            ->where('club_id', $clubId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    public function applyDelta(ClubFund $fund, float|int|string $delta): ClubFund
    {
        if ((float) $delta !== 0.0) {
            $fund->increment('balance', $delta);
        }

        return $fund->refresh();
    }
}
