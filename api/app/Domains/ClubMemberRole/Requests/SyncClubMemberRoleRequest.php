<?php

namespace App\Domains\ClubMemberRole\Requests;

use App\Base\BaseRequest;

class SyncClubMemberRoleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id' => 'required|integer|exists:users,id',
            'role_slug' => 'required|string|exists:roles,slug',
            'club_slug' => 'required|string|exists:club_translations,slug',
        ];
    }

    public function attributes(): array
    {
        return [
            'user_id' => __('domains/club_member_role.attributes.user_id'),
            'role_slug' => __('domains/club_member_role.attributes.role_slug'),
            'club_slug' => __('domains/club_member_role.attributes.club_slug'),
        ];
    }
}
