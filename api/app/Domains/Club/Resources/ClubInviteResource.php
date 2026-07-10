<?php

namespace App\Domains\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubInviteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'club_id'     => $this->club_id,
            'token'       => $this->token,
            'join_url'    => url('/clubs/join?token=' . $this->token),
            'expires_at'  => $this->expires_at?->toIso8601String(),
            'used_count'  => $this->used_count,
            'sort_order'  => $this->sort_order,
            'is_active'   => (bool) $this->is_active,
            'is_expired'  => $this->expires_at && $this->expires_at->isPast(),
            'created_by'  => $this->whenLoaded('creator', fn() => [
                'id'   => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
