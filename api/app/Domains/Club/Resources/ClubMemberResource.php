<?php

namespace App\Domains\Club\Resources;

use App\Domains\Role\Resources\RoleResource;
use App\Domains\User\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            // 'club_id'         => $this->club_id,
            // 'user_id'         => $this->user_id,
            'join_type'       => $this->join_type,
            'status'          => $this->status,
            'is_active'       => (bool) $this->is_active,
            'joined_at'       => $this->joined_at,
            'rejected_reason' => $this->rejected_reason,

            // Relations
            'user' => new UserResource($this->whenLoaded('user')),

            'role' => $this->when(
                $this->user?->relationLoaded('clubMemberRoles')
                    && $this->user->clubMemberRoles->isNotEmpty(),
                fn() => RoleResource::make(
                    $this->user->clubMemberRoles->first()->role
                )
            ),

            'reviewedBy'    => $this->whenLoaded('reviewedBy', fn() => $this->reviewedBy ? [
                'id'   => $this->reviewedBy->id,
                'fullname' => $this->reviewedBy->fullname,
            ] : null),
            'invitedBy'      => $this->whenLoaded('invitedBy', fn() => $this->invitedBy ? [
                'id'    => $this->invitedBy->id,
                'fullname' => $this->invitedBy->fullname,
            ] : null),
            'removedBy'      => $this->whenLoaded('removedBy', fn() => $this->removedBy ? [
                'id'    => $this->removedBy->id,
                'fullname' => $this->removedBy->fullname,
            ] : null),

            'created_at'  => $this->created_at,
            'reviewed_at' => $this->reviewed_at,
            'removed_at' => $this->removed_at,
        ];
    }
}
