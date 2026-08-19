<?php

namespace App\Domains\Dashboard\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FundPeriodDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'period_id' => $this->period_id,
            'year' => $this->year,
            'month' => $this->month,
            'total_expected' => (float) $this->total_expected,
            'total_paid' => (float) $this->total_paid,
            'total_pending' => (float) $this->total_pending,
            'paid_count' => (int) $this->paid_count,
            'pending_count' => (int) $this->pending_count,
            'is_active' => (bool) $this->is_active,
            'is_locked' => (bool) $this->is_locked,
        ];
    }
}
