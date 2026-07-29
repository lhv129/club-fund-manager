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
                'fullname'  => $this->user->fullname,
                'email' => $this->user->email,
            ]),
            'reviewedBy'    => $this->whenLoaded('reviewedBy', fn () => $this->reviewedBy ? [
                'id'   => $this->reviewedBy->id,
                'fullname' => $this->reviewedBy->fullname,
            ] : null),
            'invitedBy'      => $this->whenLoaded('invitedBy', fn () => $this->invitedBy ? [
                'id'    => $this->invitedBy->id,
                'token' => $this->invitedBy->token,
            ] : null),
            'roles'       => $this->whenLoaded('user.clubMemberRoles.role.translations', fn () =>
                $this->user->clubMemberRoles->map(fn ($clubMemberRole) => [
                    'id' => $clubMemberRole->role->id,
                    'slug' => $clubMemberRole->role->slug,
                    'translations' => $clubMemberRole->role->relationLoaded('translations') ? $clubMemberRole->role->translations : [],
                ])
            ),

            'created_at'  => $this->created_at?->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
        ];
    }
}
