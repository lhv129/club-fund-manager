<?php

namespace App\Domains\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubInviteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'invite_code' => $this->invite_code,

            'club' => $this->whenLoaded('club', fn() => [
                'locale' => $this->club->translation->locale,
                'name'   => $this->club->translation->name,
                'slug'   => $this->club->translation->slug,
            ]),

            'expires_at' => $this->expires_at?->toIso8601String(),
            'used_count' => $this->used_count,
            'is_active' => (bool) $this->is_active,
            'is_expired' => $this->expires_at && $this->expires_at->isPast(),

            'created_by' => $this->whenLoaded('createdBy', fn() => [
                'id' => $this->createdBy->id,
                'fullname' => $this->createdBy->fullname,
                'phone' => $this->createdBy->phone,
                'avatar' => $this->createdBy->avatar,
            ]),

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
