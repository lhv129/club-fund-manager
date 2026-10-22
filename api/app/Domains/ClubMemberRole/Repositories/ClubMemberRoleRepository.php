<?php

namespace App\Domains\ClubMemberRole\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubMember;
use App\Domains\ClubMemberRole\Models\ClubMemberRole;
use App\Services\Authorization\PermissionCacheService;


class ClubMemberRoleRepository extends BaseRepository
{
    public function __construct(
        ClubMemberRole $model,
        protected PermissionCacheService $permissionCache,
    ) {
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

            $this->permissionCache->forgetUser($member->user_id);

            return $clubMemberRole;
        }

        $role = $this->model->create([
            'club_id'   => $member->club_id,
            'user_id'   => $member->user_id,
            'role_id'   => $roleId,
            'is_active' => true,
        ]);

        $this->permissionCache->forgetUser($member->user_id);

        return $role;
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

        $this->permissionCache->forgetUser($member->user_id);
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

        $this->permissionCache->forgetUser($member->user_id);
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

        $this->permissionCache->forgetUser($member->user_id);
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

        $this->permissionCache->forgetUser($member->user_id);

        return $role;
    }


    /**
     * Tìm bản ghi role đang tồn tại theo ID, bao gồm bản ghi đã soft delete.
     */
    public function findRoleIncludingTrashed(int $id): ?ClubMemberRole
    {
        return $this->model->withTrashed()->find($id);
    }

    /**
     * Tìm role global của user.
     * Chỉ lấy bản ghi chưa bị soft delete.
     */
    public function findGlobalRoleByUserId(int $userId): ?ClubMemberRole
    {
        return $this->model
            ->where('user_id', $userId)
            ->whereNull('club_id')
            ->first();
    }

    /**
     * Tạo hoặc cập nhật role global của user.
     */
    public function syncGlobalRole(int $userId, int $roleId): ClubMemberRole
    {
        $globalRole = $this->findGlobalRoleByUserId($userId);

        if ($globalRole) {
            $globalRole->update([
                'role_id' => $roleId,
                'is_active' => true,
            ]);

            return $globalRole->load('role', 'role.translation:id,role_id,locale,name');
        }

        // Nếu đã có bản ghi global bị soft delete thì khôi phục.
        $deletedGlobalRole = $this->model
            ->onlyTrashed()
            ->where('user_id', $userId)
            ->whereNull('club_id')
            ->first();

        if ($deletedGlobalRole) {
            $deletedGlobalRole->restore();

            $deletedGlobalRole->update([
                'role_id' => $roleId,
                'is_active' => true,
            ]);

            return $deletedGlobalRole->load(
                'role',
                'role.translation:id,role_id,locale,name'
            );
        }

        return $this->model->create([
            'user_id' => $userId,
            'role_id' => $roleId,
            'club_id' => null,
            'is_active' => true,
        ])->load('role', 'role.translation:id,role_id,locale,name');
    }


    public function findByUserIdAndClubId(int $userId, int $clubId)
    {
        return $this->model
            ->where('user_id', $userId)
            ->where('club_id', $clubId)
            ->first();
    }
}
