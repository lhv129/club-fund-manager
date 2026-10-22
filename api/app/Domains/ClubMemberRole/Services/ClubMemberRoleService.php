<?php

namespace App\Domains\ClubMemberRole\Services;

use App\Base\BaseService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\ClubMemberRole\Repositories\ClubMemberRoleRepository;
use App\Domains\Role\Models\Role;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;
use App\Services\Authorization\PermissionCacheService;
use Illuminate\Support\Facades\DB;

class ClubMemberRoleService extends BaseService
{
    protected object $repository;
    protected object $roleRepository;
    protected object $clubRepository;
    protected PermissionCacheService $permissionCache;

    public function __construct(
        ClubMemberRoleRepository $repository,
        RoleRepository $roleRepository,
        ClubRepository $clubRepository,
        PermissionCacheService $permissionCache,
    ) {
        $this->repository = $repository;
        $this->roleRepository = $roleRepository;
        $this->clubRepository = $clubRepository;
        $this->permissionCache = $permissionCache;
    }

    /**
     * Đồng bộ role của thành viên trong một CLB.
     *
     * Xác định bản ghi club_member_roles dựa trên:
     * - user_id
     * - club_slug
     *
     * Không cần truyền club_member_role_id từ client.
     */
    public function syncClubMemberRole(array $data)
    {
        return DB::transaction(function () use ($data) {
            $userId = (int) $data['user_id'];

            /**
             * 1. Tìm CLB từ club_slug.
             */
            $club = $this->clubRepository
                ->findByTranslationSlug($data['club_slug']);

            if (! $club) {
                throw new ApiException(
                    __('domains/club.not_found'),
                    404,
                    'CLUB_NOT_FOUND'
                );
            }

            /**
             * 2. Tìm role hiện tại của user trong CLB.
             *
             * club_member_roles.club_id phải là đúng club hiện tại.
             */
            $clubMemberRole = $this->repository
                ->findByUserIdAndClubId(
                    $userId,
                    (int) $club->id
                );

            if (! $clubMemberRole || $clubMemberRole->trashed()) {
                throw new ApiException(
                    __('domains/club_member_role.role_not_found'),
                    404,
                    'CLUB_MEMBER_ROLE_NOT_FOUND'
                );
            }

            /**
             * 3. Tìm role mới.
             */
            $role = $this->roleRepository
                ->findBySlug($data['role_slug']);

            if (! $role) {
                throw new ApiException(
                    __('domains/role.not_found'),
                    404,
                    'ROLE_NOT_FOUND'
                );
            }

            /**
             * 4. Đồng bộ role.
             *
             * GLOBAL:
             *   club_id = null
             *
             * CLUB:
             *   club_id = club hiện tại
             */
            if ($role->scope === Role::SCOPE_GLOBAL) {
                $clubMemberRole->update([
                    'role_id' => $role->id,
                    'club_id' => null,
                ]);
            } elseif ($role->scope === Role::SCOPE_CLUB) {
                $clubMemberRole->update([
                    'role_id' => $role->id,
                    'club_id' => $club->id,
                ]);
            } else {
                throw new ApiException(
                    __('domains/club_member_role.invalid_role_scope'),
                    422,
                    'INVALID_ROLE_SCOPE'
                );
            }

            /**
             * 5. Load relationship để trả response.
             */
            $clubMemberRole->load(
                'role',
                'role.translation:id,role_id,locale,name'
            );

            /**
             * 6. Xóa permission cache.
             */
            $this->permissionCache->forgetUser($userId);

            return $clubMemberRole;
        });
    }

    /**
     * Đồng bộ role global của user.
     *
     * Mỗi user chỉ có một bản ghi role global:
     * club_member_roles.club_id = null.
     *
     * Nếu chưa tồn tại thì tạo mới.
     */
    public function syncUserRole(array $data)
    {
        return DB::transaction(function () use ($data) {
            $userId = (int) $data['user_id'];

            $role = $this->roleRepository
                ->findBySlug($data['role_slug']);

            if (! $role) {
                throw new ApiException(
                    __('domains/role.not_found'),
                    404,
                    'ROLE_NOT_FOUND'
                );
            }

            // API này chỉ chấp nhận role cấp hệ thống.
            if ($role->scope !== Role::SCOPE_GLOBAL) {
                throw new ApiException(
                    __('domains/club_member_role.global_role_required'),
                    422,
                    'GLOBAL_ROLE_REQUIRED'
                );
            }

            // Cập nhật hoặc tạo bản ghi global với club_id = null.
            $globalRole = $this->repository->syncGlobalRole(
                $userId,
                (int) $role->id
            );

            $globalRole->load(
                'role',
                'role.translation:id,role_id,locale,name'
            );

            $this->permissionCache->forgetUser($userId);

            return $globalRole;
        });
    }

    /**
     * Gỡ role global của user.
     *
     * Chỉ gỡ bản ghi có club_id = null.
     * Không ảnh hưởng role của user trong các CLB.
     */
    public function destroyUserRole(int $userId): void
    {
        DB::transaction(function () use ($userId) {
            $globalRole = $this->repository
                ->findGlobalRoleByUserId($userId);

            if (! $globalRole) {
                throw new ApiException(
                    __('domains/club_member_role.role_not_found'),
                    404,
                    'GLOBAL_ROLE_NOT_FOUND'
                );
            }

            $globalRole->update([
                'is_active' => false,
            ]);

            $globalRole->delete();

            $this->permissionCache->forgetUser($userId);
        });
    }
}
