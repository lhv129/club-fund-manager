<?php

namespace App\Domains\Auth\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'fullname'         => $this->fullname,
            'email'        => $this->email,
            'phone'        => $this->phone,
            'avatar'       => $this->avatar,
            'is_superadmin' => $this->isSuperAdmin(),
            'is_active'    => $this->is_active,

            /*
             * SuperAdmin  → ['*']
             * User thường → [club_id => [module => [actions]]]
             *
             * Frontend dùng để render menu, ẩn/hiện nút dựa theo club context.
             */
            'permissions'  => $this->permissionsGroupedByClub(),
        ];
    }
}
