<?php

namespace App\Domains\MonthlyContribution\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MonthlyContributionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Monthly Contribution
            |--------------------------------------------------------------------------
            */

            'id'             => $this->id,
            'club_id'        => $this->club_id,
            'user_id'        => $this->user_id,
            'period_id'      => $this->period_id,
            'transaction_id' => $this->transaction_id,

            'amount'       => $this->amount,
            'status'       => $this->status,
            'paid_by'      => $this->paid_by,
            'payment_date' => $this->payment_date?->toIso8601String(),

            'is_active' => $this->is_active,

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'delete_action' => $this->when(
                isset($this->delete_action),
                $this->delete_action,
            ),

            /*
            |--------------------------------------------------------------------------
            | User
            |--------------------------------------------------------------------------
            */

            'user' => $this->whenLoaded('user', function () {
                if (!$this->user) {
                    return null;
                }

                return [
                    'id'       => $this->user->id,
                    'fullname' => $this->user->fullname,
                    'email'    => $this->user->email,
                    'gender'   => $this->user->gender,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Club
            |--------------------------------------------------------------------------
            */

            'club' => $this->whenLoaded('club', function () {
                if (!$this->club) {
                    return null;
                }

                return [
                    'id'   => $this->club->id,
                    'logo' => $this->club->logo,
                    'translations' => $this->club->relationLoaded('translations')
                        ? $this->club->translations->map(fn($translation) => [
                            'id'     => $translation->id,
                            'locale' => $translation->locale,
                            'name'   => $translation->name,
                            'slug'   => $this->club->slug,
                        ])->values()->all()
                        : [],
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Fund Period
            |--------------------------------------------------------------------------
            */

            'period' => $this->whenLoaded('period', function () {
                if (!$this->period) {
                    return null;
                }

                return [
                    'id'                     => $this->period->id,
                    'year'                   => $this->period->year,
                    'month'                  => $this->period->month,
                    'male_amount'            => $this->period->male_amount,
                    'female_amount'          => $this->period->female_amount,
                    'exchange_male_amount'  => $this->period->exchange_male_amount,
                    'exchange_female_amount' => $this->period->exchange_female_amount,
                    'is_locked'              => $this->period->is_locked,
                    'is_active'              => $this->period->is_active,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Payment Code
            |--------------------------------------------------------------------------
            */

            'payment_code' => $this->whenLoaded('paymentCode', function () {
                if (!$this->paymentCode) {
                    return null;
                }

                return [
                    'id'           => $this->paymentCode->id,
                    'payment_code' => $this->paymentCode->payment_code,
                    'status'       => $this->paymentCode->status,
                    'expired_at'   => $this->paymentCode->expired_at?->toIso8601String(),
                    'used_at'      => $this->paymentCode->used_at?->toIso8601String(),
                    'is_active'    => $this->paymentCode->is_active,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Transaction
            |--------------------------------------------------------------------------
            */

            'transaction' => $this->whenLoaded('transaction', function () {
                if (!$this->transaction) {
                    return null;
                }

                return [
                    'id'               => $this->transaction->id,
                    'source'           => $this->transaction->source,
                    'type'             => $this->transaction->type,
                    'amount'           => $this->transaction->amount,
                    'balance'          => $this->transaction->balance,
                    'reference_code'   => $this->transaction->reference_code,
                    'sender_name'      => $this->transaction->sender_name,
                    'sender_account'   => $this->transaction->sender_account,
                    'description'      => $this->transaction->description,
                    'transaction_date' => $this->transaction->transaction_date?->toIso8601String(),

                    /*
                    |--------------------------------------------------------------------------
                    | Bank Account
                    |--------------------------------------------------------------------------
                    */

                    'bank_account' => $this->transaction->relationLoaded('bankAccount')
                        ? (
                            $this->transaction->bankAccount
                            ? [
                                'id'             => $this->transaction->bankAccount->id,
                                'account_number' => $this->transaction->bankAccount->account_number,
                                'account_name'   => $this->transaction->bankAccount->account_name,
                                'qr_image'       => $this->transaction->bankAccount->qr_image,
                                'is_default'     => $this->transaction->bankAccount->is_default,

                                /*
                                |--------------------------------------------------------------------------
                                | Bank
                                |--------------------------------------------------------------------------
                                */

                                'bank' => $this->transaction->bankAccount->relationLoaded('bank')
                                    ? (
                                        $this->transaction->bankAccount->bank
                                        ? [
                                            'id'   => $this->transaction->bankAccount->bank->id,
                                            'name' => $this->transaction->bankAccount->bank->name,
                                            'code' => $this->transaction->bankAccount->bank->code,
                                            'logo' => $this->transaction->bankAccount->bank->logo,
                                        ]
                                        : null
                                    )
                                    : null,
                            ]
                            : null
                        )
                        : null,
                ];
            }),
        ];
    }
}
