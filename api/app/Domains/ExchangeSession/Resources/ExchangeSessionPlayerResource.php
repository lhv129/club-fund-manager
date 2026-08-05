<?php

namespace App\Domains\ExchangeSession\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeSessionPlayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'exchange_session_id'    => $this->exchange_session_id,
            'user_id'                => $this->user_id,
            'player_name'            => $this->player_name,
            'amount'                 => $this->amount,
            'paid'                   => $this->paid,
            'checked_in'             => $this->checked_in,
            'is_active'               => $this->is_active,
            'sort_order'             => $this->sort_order,

            'user' => $this->whenLoaded('user', fn () => [
                'id'       => $this->user->id,
                'fullname' => $this->user->fullname,
            ]),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
