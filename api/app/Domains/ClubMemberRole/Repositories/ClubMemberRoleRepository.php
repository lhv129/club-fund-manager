<?php

namespace App\Domains\ClubMemberRole\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubMember;
use App\Domains\ClubMemberRole\Models\ClubMemberRole;


class ClubMemberRoleRepository extends BaseRepository
{
    public function __construct(ClubMemberRole $model)
    {
        parent::__construct($model);
    }

    /**
     * Gán role cho member.
     * Nếu role đã từng tồn tại nhưng bị soft delete thì restore.
     */
    public function restoreOrAssignRole(ClubMember $member, int $roleId): ClubMemberRole
    {
        $clubMemberRole = $this->model
            ->withTrashed()
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->where('role_id', $roleId)
            ->first();

        if ($clubMemberRole) {

            if ($clubMemberRole->trashed()) {
                $clubMemberRole->restore();
            }

            $clubMemberRole->update([
                'is_active' => true,
            ]);

            return $clubMemberRole;
        }

        return $this->model->create([
            'club_id'   => $member->club_id,
            'user_id'   => $member->user_id,
            'role_id'   => $roleId,
            'is_active' => true,
        ]);
    }

    /**
     * Soft delete toàn role của member.
     */
    public function removeMemberRoles(ClubMember $member): void
    {
        $this->model
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->update([
                'is_active' => false,
            ]);

        $this->model
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->delete();
    }

    /**
     * Restore toàn bộ role của member.
     */
    public function restoreMemberRoles(ClubMember $member): void
    {
        $roles = $this->model
            ->onlyTrashed()
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->get();

        foreach ($roles as $role) {
            $role->restore();

            $role->update([
                'is_active' => true,
            ]);
        }
    }

    /**
     * Xóa 1 role khỏi member.
     */
    public function removeRole(
        ClubMember $member,
        int $roleId
    ): void {
        $this->model
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->where('role_id', $roleId)
            ->update([
                'is_active' => false,
            ]);

        $this->model
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->where('role_id', $roleId)
            ->delete();
    }

    /**
     * Restore 1 role.
     */
    public function restoreRole(
        ClubMember $member,
        int $roleId
    ): ?ClubMemberRole {
        $role = $this->model
            ->onlyTrashed()
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->where('role_id', $roleId)
            ->first();

        if (! $role) {
            return null;
        }

        $role->restore();

        $role->update([
            'is_active' => true,
        ]);

        return $role;
    }
}
