<?php

namespace App\Domains\Transaction\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'club_id' => $this->club_id,
            'bank_account_id' => $this->bank_account_id,

            'type' => $this->type,
            'amount' => $this->amount,
            'balance' => $this->balance,

            'description' => $this->description,
            'reference_code' => $this->reference_code,

            'sender_name' => $this->sender_name,
            'sender_account' => $this->sender_account,

            'transaction_date' => $this->transaction_date?->toISOString(),

            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,

            'club' => $this->whenLoaded('club', fn() => [
                'id' => $this->club->id,
                'name' => $this->club->name,
            ]),

            'bank_account' => $this->whenLoaded('bankAccount', fn() => ['id' => $this->bankAccount->id, 'account_number' => $this->bankAccount->account_number, 'account_name' => $this->bankAccount->account_name, 'bank' => $this->bankAccount->relationLoaded('bank') ? ['id' => $this->bankAccount->bank->id, 'code' => $this->bankAccount->bank->code, 'name' => $this->bankAccount->bank->name, 'short_name' => $this->bankAccount->bank->short_name, 'logo' => $this->bankAccount->bank->logo,] : null,]),

            'webhook_config' => $this->whenLoaded('webhookConfig', fn() => [
                'id' => $this->webhookConfig->id,
                'type' => $this->webhookConfig->type,
            ]),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
