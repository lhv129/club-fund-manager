<?php

namespace App\Domains\ClubMemberRole\Services;

use App\Base\BaseService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\ClubMemberRole\Repositories\ClubMemberRoleRepository;
use App\Domains\Role\Models\Role;
use App\Domains\Role\Repositories\RoleRepository;
use App\Services\Authorization\PermissionCacheService;

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

    public function syncClubMemberRole(array $data)
    {
        $clubMemberRole = $this->find($data['club_member_role_id']);

        $role = $this->roleRepository->findBySlug($data['role_slug']);

        $club = $this->clubRepository->findByTranslationSlug($data['club_slug']);

        if ($role->scope === Role::SCOPE_GLOBAL) {
            $this->repository->update(
                $clubMemberRole,
                [
                    'role_id' => $role->id,
                    'club_id' => null,
                ]
            );
        }
        if ($role->scope === Role::SCOPE_CLUB) {
            $this->repository->update(
                $clubMemberRole,
                [
                    'role_id' => $role->id,
                    'club_id' => $club->id,
                ]
            );
        }
        $clubMemberRole->load('role', 'role.translation:id,role_id,locale,name');
        $this->permissionCache->forgetUser((int) $clubMemberRole->user_id);
        return $clubMemberRole;
    }
}
