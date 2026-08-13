<?php

namespace App\Domains\MemberPaymentCode\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberPaymentCodeResource extends JsonResource
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
            $this->whenLoaded(
                'monthlyContribution',
                function () {
                    $contribution =
                        $this->monthlyContribution;

                    return [
                        'id' =>
                        $contribution->id,

                        'period_id' =>
                        $contribution->period_id,

                        'user_id' =>
                        $contribution->user_id,

                        'amount' =>
                        $contribution->amount,

                        'status' =>
                        $contribution->status,

                        'user' =>
                        $contribution->relationLoaded('user')
                            ? [
                                'id' =>
                                $contribution->user->id,

                                'fullname' =>
                                $contribution->user->fullname,
                            ]
                            : null,

                        'period' =>
                        $contribution->relationLoaded('period')
                            ? [
                                'id' =>
                                $contribution->period->id,

                                'year' =>
                                $contribution->period->year,

                                'month' =>
                                $contribution->period->month,
                            ]
                            : null,
                    ];
                }
            ),

            'created_at' =>
            $this->created_at?->toISOString(),

            'updated_at' =>
            $this->updated_at?->toISOString(),
        ];
    }
}
