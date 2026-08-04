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
            'is_active'       => $this->is_active,
            'sort_order'      => $this->sort_order,

            // Chỉ hiện bankAccount nếu đã được eager load — tránh N+1.
            'bank_account' => $this->whenLoaded('bankAccount', fn () => [
                'id'             => $this->bankAccount->id,
                'bank_name'      => $this->bankAccount->bank_name,
                'account_number' => $this->bankAccount->account_number,
                'account_holder' => $this->bankAccount->account_holder,
            ]),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
