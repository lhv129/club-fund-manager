<?php

namespace App\Domains\Auth\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'first_name'   => $this->first_name,
            'last_name'    => $this->last_name,
            'fullname' => $this->fullname,
            'email'        => $this->email,
            'phone'        => $this->phone,
            'avatar'       => $this->avatar,
            'date_of_birth' => $this->date_of_birth,
            'gender' => $this->gender,
            'address' => $this->address,
            'is_superadmin'  => $this->isSuperAdmin(),
            'is_system_admin'=> $this->isSystemAdmin(),
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
