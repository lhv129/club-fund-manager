<?php

namespace App\Domains\Role\Repositories;

use App\Base\BaseRepository;
use App\Domains\Role\Models\RolePermission;


class RolePermissionRepository extends BaseRepository
{
    public function __construct(RolePermission $model)
    {
        parent::__construct($model);
    }

    public function getPermissionIdsByRoleId(int $roleId)
    {
        return $this->model
            ->where('role_id', $roleId)
            ->where('is_active', 1)
            ->pluck('permission_id')
            ->toArray();
    }

    public function getPermissionIdsByRole($role)
    {
        return $role->permissions()->pluck('permissions.id')->toArray();
    }

    public function updatePivot($role, $permissionId, array $data)
    {
        return $role->permissions()->updateExistingPivot($permissionId, $data);
    }

    public function attach($role, $permissionId, array $data)
    {
        return $role->permissions()->attach($permissionId, $data);
    }

    public function getRolePermissions($role)
    {
        return $role->permissions()
            ->withPivot('is_active')
            ->get()
            ->mapWithKeys(function ($item) {
                return [
                    $item->id => (int) $item->pivot->is_active
                ];
            })
            ->toArray();
    }
}