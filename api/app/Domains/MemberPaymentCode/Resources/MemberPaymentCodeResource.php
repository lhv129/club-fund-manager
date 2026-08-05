<?php

namespace App\Domains\MemberPaymentCode\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberPaymentCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'monthly_contribution_id'  => $this->monthly_contribution_id,
            'payment_code'             => $this->payment_code,
            'status'                   => $this->status,
            'expired_at'               => $this->expired_at?->toISOString(),
            'used_at'                  => $this->used_at?->toISOString(),
            'is_active'                 => $this->is_active,
            'sort_order'              => $this->sort_order,

            'monthly_contribution' => $this->whenLoaded('monthlyContribution', fn () => [
                'id'         => $this->monthlyContribution->id,
                'period_id'  => $this->monthlyContribution->period_id,
                'user_id'    => $this->monthlyContribution->user_id,
                'amount'     => $this->monthlyContribution->amount,
                'status'     => $this->monthlyContribution->status,
            ]),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
