<?php

namespace App\Domains\Dashboard\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContributionDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'period_id' => $this->period_id,
            'amount' => $this->amount,
            'status' => $this->status,

            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'fullname' => $this->user->fullname,
            ]),
        ];
    }
}
