<?php

namespace App\Domains\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'club_id'         => $this->club_id,
            'user_id'         => $this->user_id,
            'join_type'       => $this->join_type,
            'status'          => $this->status,
            'is_active'       => (bool) $this->is_active,
            'joined_at'       => $this->joined_at?->toIso8601String(),
            'rejected_reason' => $this->rejected_reason,

            // Relations
            'user'        => $this->whenLoaded('user', fn () => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ]),
            'reviewer'    => $this->whenLoaded('reviewer', fn () => $this->reviewer ? [
                'id'   => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ] : null),
            'invite'      => $this->whenLoaded('invite', fn () => $this->invite ? [
                'id'    => $this->invite->id,
                'token' => $this->invite->token,
            ] : null),
            'roles'       => $this->whenLoaded('roles', fn () =>
                $this->roles->map(fn ($role) => [
                    'id'           => $role->id,
                    'slug'         => $role->slug,
                    'translations' => $role->relationLoaded('translations') ? $role->translations : [],
                ])
            ),

            'created_at'  => $this->created_at?->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
        ];
    }
}
