<?php

namespace Domains\User\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray($request)
    {
        $user = $this;

        // SUPER ADMIN (role_id = 1)
        if ($user->role_id == 1) {
            $permissions = ['*'];
        } else {
            $permissions = $user->role
                ? $user->role->permissionsActive
                ->map(fn($p) => $p->module->name . '.' . $p->action)
                ->values()
                ->toArray()
                : [];
        }

        return [
            'id' => $user->id,
            'role_id' => $user->role_id,
            'role_name' => $user->role?->name,

            'permissions' => $permissions,

            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'display_name' => $user->display_name,
            'username' => $user->username,

            'gender' => $user->gender,
            'date_of_birth' => $user->date_of_birth,
            'address' => $user->address,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'bg_image' => $user->bg_image,

            'count' => $user->count,
            'description' => $user->description,
        ];
    }
}
