<?php

namespace App\Domains\Dashboard\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FundPeriodDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'club_id' => $this->club_id,
            'year' => $this->year,
            'month' => $this->month,

            'male_amount' => $this->male_amount,
            'female_amount' => $this->female_amount,

            'exchange_male_amount' => $this->exchange_male_amount,
            'exchange_female_amount' => $this->exchange_female_amount,

            'is_active' => (bool) $this->is_active,
            'is_locked' => (bool) $this->is_locked,
        ];
    }
}
