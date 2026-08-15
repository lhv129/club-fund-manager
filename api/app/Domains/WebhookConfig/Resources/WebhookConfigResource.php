<?php

namespace App\Domains\WebhookConfig\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WebhookConfigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'club_id'         => $this->club_id,
            'bank_account_id' => $this->bank_account_id,
            'type'            => $this->type,
            'webhook_url'     => $this->webhook_url,
            'is_verified'     => $this->is_verified,

            // Chỉ hiện bankAccount nếu đã được eager load — tránh N+1.
            'bank_account' => $this->whenLoaded('bankAccount', fn () => [
                'id'             => $this->bankAccount->id,
                'bank_id'      => $this->bankAccount->bank_id,
                'account_number' => $this->bankAccount->account_number,
                'account_name' => $this->bankAccount->account_name,
            ]),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
