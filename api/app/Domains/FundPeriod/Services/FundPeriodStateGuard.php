<?php

namespace App\Domains\FundPeriod\Services;

use App\Domains\FundPeriod\Models\FundPeriod;
use App\Exceptions\ApiException;

class FundPeriodStateGuard
{
    public function ensureUnlocked(FundPeriod $fundPeriod): void
    {
        if ($fundPeriod->is_locked) {
            throw new ApiException(
                __('domains/fund_period.locked'),
                422,
            );
        }
    }
}
