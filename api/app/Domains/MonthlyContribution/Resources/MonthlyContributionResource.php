<?php

namespace App\Domains\MonthlyContribution\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MonthlyContributionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'club_id'        => $this->club_id,
            'user_id'        => $this->user_id,
            'period_id'      => $this->period_id,
            'transaction_id' => $this->transaction_id,

            'amount'       => $this->amount,
            'status'       => $this->status,
            'paid_by'      => $this->paid_by,
            'payment_date' => $this->payment_date?->toIso8601String(),

            'sort_order' => $this->sort_order,
            'is_active'  => $this->is_active,

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Relations — chỉ xuất khi đã được load
            'user' => $this->whenLoaded('user', fn() => [
                'id'    => $this->user->id,
                'fullname'  => $this->user->fullname,
                'email' => $this->user->email,
                'gender' => $this->user->gender,
            ]),

            'period' => $this->whenLoaded('period', fn() => [
                'id'                    => $this->period->id,
                'year'                  => $this->period->year,
                'month'                 => $this->period->month,
                'male_amount'           => $this->period->male_amount,
                'female_amount'         => $this->period->female_amount,
                'exchange_male_amount'  => $this->period->exchange_male_amount,
                'exchange_female_amount' => $this->period->exchange_female_amount,
            ]),

            'transaction' => $this->whenLoaded('transaction', fn() => [
                'id'               => $this->transaction->id,
                'source'           => $this->transaction->source,
                'type'             => $this->transaction->type,
                'amount'           => $this->transaction->amount,
                'reference_code'   => $this->transaction->reference_code,
                'transaction_date' => $this->transaction->transaction_date?->toIso8601String(),
            ]),

            'payment_code' => $this->whenLoaded('paymentCode', fn() => $this->paymentCode ? [
                'id'           => $this->paymentCode->id,
                'payment_code' => $this->paymentCode->payment_code,
                'status'       => $this->paymentCode->status,
                'expired_at'   => $this->paymentCode->expired_at?->toIso8601String(),
                'used_at'      => $this->paymentCode->used_at?->toIso8601String(),
            ] : null),
        ];
    }
}
