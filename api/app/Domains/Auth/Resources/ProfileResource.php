<?php

namespace App\Domains\Auth\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray($request)
    {
        $user = $this;

        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'fullname' => $user->fullname,
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
