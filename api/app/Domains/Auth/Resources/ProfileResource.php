<?php

namespace App\Domains\Auth\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'first_name'     => $this->first_name,
            'last_name'      => $this->last_name,
            'fullname'       => $this->fullname,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'avatar'         => $this->avatar,
            'date_of_birth'  => $this->date_of_birth,
            'gender'         => $this->gender,
            'address'        => $this->address,

            'is_superadmin'  => $this->isSuperAdmin(),
            'is_system_admin' => $this->isSystemAdmin(),

            'permissions'    => $this->permissionsGroupedByClub(),
        ];
    }
}
