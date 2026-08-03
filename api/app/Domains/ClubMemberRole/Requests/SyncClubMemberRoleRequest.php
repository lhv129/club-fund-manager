<?php

namespace App\Domains\ClubMemberRole\Requests;

use App\Base\BaseRequest;

class SyncClubMemberRoleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'club_member_role_id' => 'required|exists:club_member_roles,id',
            'role_slug' => 'required|string|exists:roles,slug',
            'club_slug' => 'required|string|exists:club_translations,slug',
        ];
    }
}
