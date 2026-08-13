<?php

namespace App\Domains\MemberPaymentCode\Resources;

use App\Domains\MonthlyContribution\Resources\MonthlyContributionResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberPaymentCodeDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'monthly_contribution_id' =>
            $this->monthly_contribution_id,

            'payment_code' =>
            $this->payment_code,

            'status' =>
            $this->status,

            'expired_at' =>
            $this->expired_at?->toISOString(),

            'used_at' =>
            $this->used_at?->toISOString(),

            'is_active' =>
            $this->is_active,

            'monthly_contribution' =>
            MonthlyContributionResource::make(
                $this->whenLoaded('monthlyContribution')
            ),

            'created_at' =>
            $this->created_at?->toISOString(),

            'updated_at' =>
            $this->updated_at?->toISOString(),
        ];
    }
}
