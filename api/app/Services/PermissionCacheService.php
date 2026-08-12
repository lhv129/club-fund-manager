<?php

namespace App\Services;

use App\Domains\User\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PermissionCacheService
{
    private const GLOBAL_VERSION_KEY = 'permissions:version:global';
    private const TTL_SECONDS = 3600;

    public function hasPermission(User $user, string $module, string $action, ?int $clubId = null): bool
    {
        $payload = $this->scopePermissions($user->id, $clubId);

        return $payload['is_superadmin']
            || in_array($action, $payload['permissions'][$module] ?? [], true);
    }

    public function isSuperAdmin(User $user): bool
    {
        return $this->scopePermissions($user->id, null)['is_superadmin'];
    }

    public function forgetUser(int $userId): void
    {
        Cache::forever($this->userVersionKey($userId), $this->userVersion($userId) + 1);
    }

    public function forgetUsersForRole(int $roleId): void
    {
        DB::table('club_member_roles')
            ->where('role_id', $roleId)
            ->distinct()
            ->pluck('user_id')
            ->each(fn ($userId) => $this->forgetUser((int) $userId));
    }

    public function forgetClub(int $clubId): void
    {
        DB::table('club_member_roles')
            ->where('club_id', $clubId)
            ->distinct()
            ->pluck('user_id')
            ->each(fn ($userId) => $this->forgetUser((int) $userId));
    }

    public function forgetAll(): void
    {
        Cache::forever(self::GLOBAL_VERSION_KEY, $this->globalVersion() + 1);
    }

    private function scopePermissions(int $userId, ?int $clubId): array
    {
        $globalVersion = $this->globalVersion();
        $userVersion = $this->userVersion($userId);
        $scope = $clubId === null ? 'system' : "club:{$clubId}";
        $key = "permissions:user:{$userId}:{$scope}:g{$globalVersion}:u{$userVersion}";

        return Cache::remember($key, self::TTL_SECONDS, function () use ($userId, $clubId) {
            $isSuperAdmin = $this->queryIsSuperAdmin($userId);

            if ($isSuperAdmin) {
                return ['is_superadmin' => true, 'permissions' => []];
            }

            $query = DB::table('club_member_roles')
                ->join('roles', function ($join) {
                    $join->on('roles.id', '=', 'club_member_roles.role_id')
                        ->where('roles.is_active', true)
                        ->whereNull('roles.deleted_at');
                })
                ->join('role_permissions', function ($join) {
                    $join->on('role_permissions.role_id', '=', 'roles.id')
                        ->where('role_permissions.is_active', true)
                        ->whereNull('role_permissions.deleted_at');
                })
                ->join('permissions', function ($join) {
                    $join->on('permissions.id', '=', 'role_permissions.permission_id')
                        ->where('permissions.is_active', true)
                        ->whereNull('permissions.deleted_at');
                })
                ->join('modules', function ($join) {
                    $join->on('modules.id', '=', 'permissions.module_id')
                        ->where('modules.is_active', true)
                        ->whereNull('modules.deleted_at');
                })
                ->where('club_member_roles.user_id', $userId)
                ->where('club_member_roles.is_active', true)
                ->whereNull('club_member_roles.deleted_at');

            if ($clubId === null) {
                $query->whereNull('club_member_roles.club_id');
            } else {
                $query->where(fn ($scope) => $scope
                    ->where('club_member_roles.club_id', $clubId)
                    ->orWhereNull('club_member_roles.club_id'));
            }

            $permissions = [];
            foreach ($query->select('modules.slug as module', 'permissions.action')->distinct()->get() as $row) {
                $permissions[$row->module][] = $row->action;
            }

            return ['is_superadmin' => false, 'permissions' => $permissions];
        });
    }

    private function queryIsSuperAdmin(int $userId): bool
    {
        return DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->where('club_member_roles.user_id', $userId)
            ->where('club_member_roles.is_active', true)
            ->whereNull('club_member_roles.deleted_at')
            ->whereNull('club_member_roles.club_id')
            ->where('roles.slug', 'superadmin')
            ->where('roles.is_active', true)
            ->whereNull('roles.deleted_at')
            ->exists();
    }

    private function globalVersion(): int
    {
        return (int) Cache::rememberForever(self::GLOBAL_VERSION_KEY, fn () => 1);
    }

    private function userVersion(int $userId): int
    {
        return (int) Cache::rememberForever($this->userVersionKey($userId), fn () => 1);
    }

    private function userVersionKey(int $userId): string
    {
        return "permissions:version:user:{$userId}";
    }
}
