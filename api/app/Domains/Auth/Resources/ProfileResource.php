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
            'is_superadmin'  => $this->isSuperAdmin(),
            'is_system_admin'=> $this->isSystemAdmin(),
            'is_active'    => $this->is_active,

            /*
             * SuperAdmin           → ['*']
             * Admin (system)       → { "club": [...], "member": [...], "user": [...] }  (FLAT, key = module slug)
             * Owner/Manager/Member → { "club_1": {...}, "club_2": {...} }                  (nested "club_{id}")
             * User vừa admin vừa   → merge cả 2 dạng trên (KHÔNG collide)
             * member của club X
             *
             * Frontend dùng để render menu, ẩn/hiện nút dựa theo club context.
             */
            'permissions'  => $this->permissionsGroupedByClub(),
        ];
    }
}
