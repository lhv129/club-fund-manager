<?php

namespace App\Domains\ClubMemberRole\Services;

use App\Base\BaseService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\ClubMemberRole\Repositories\ClubMemberRoleRepository;
use App\Domains\Role\Models\Role;
use App\Domains\Role\Repositories\RoleRepository;

class ClubMemberRoleService extends BaseService
{
    protected object $repository;
    protected object $roleRepository;
    protected object $clubRepository;

    public function __construct(
        ClubMemberRoleRepository $repository,
        RoleRepository $roleRepository,
        ClubRepository $clubRepository
    ) {
        $this->repository = $repository;
        $this->roleRepository = $roleRepository;
        $this->clubRepository = $clubRepository;
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
        return $clubMemberRole;
    }
}
