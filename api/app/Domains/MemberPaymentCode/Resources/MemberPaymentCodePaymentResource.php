<?php

namespace App\Domains\MemberPaymentCode\Resources;

use App\Domains\MemberPaymentCode\Data\MemberPaymentCodePaymentData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MemberPaymentCodePaymentData
 */
class MemberPaymentCodePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payment = $this->paymentCode;
        $bankAccount = $this->bankAccount;
        $bank = $bankAccount->bank;

        return [
            'id' =>
            $payment->id,

            'monthly_contribution_id' =>
            $payment->monthly_contribution_id,

            'payment_code' =>
            $payment->payment_code,

            'status' =>
            $payment->status,

            'expired_at' =>
            $payment->expired_at,

            'used_at' =>
            $payment->used_at,

            'is_active' =>
            $payment->is_active,

            'amount' =>
            $this->getAmount(),

            'bank_account' => [
                'id' =>
                $bankAccount->id,

                'account_number' =>
                $bankAccount->account_number,

                'account_name' =>
                $bankAccount->account_name,

                // Luôn trả QR image mặc định
                'qr_image' =>
                $bankAccount->qr_image,

                'is_default' =>
                $bankAccount->is_default,

                'bank' => [
                    'id' =>
                    $bank->id,

                    'code' =>
                    $bank->code,

                    'name' =>
                    $bank->name,

                    'short_name' =>
                    $bank->short_name,

                    'logo' =>
                    $bank->logo,
                ],
            ],

            'qr' => [
                'enabled' =>
                $this->qrEnabled,

                'url' =>
                $this->qrUrl,
            ],
        ];
    }
}
