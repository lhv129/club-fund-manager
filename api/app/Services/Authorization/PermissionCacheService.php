<?php

namespace App\Services\Authorization;

use App\Domains\User\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PermissionCacheService
{
    private const GLOBAL_VERSION_KEY = 'permissions:version:global';
    private const TTL_SECONDS = 3600;

    public function getPermissionPayload(User $user): array
    {
        $locale = app()->getLocale();
        $globalVersion = $this->globalVersion();
        $userVersion = $this->userVersion($user->id);
        $key = "permissions:user:{$user->id}:locale:{$locale}:g{$globalVersion}:u{$userVersion}";

        return Cache::remember($key, self::TTL_SECONDS, fn() => $this->buildPermissionPayload($user->id));
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
            ->each(fn($userId) => $this->forgetUser((int) $userId));
    }

    public function forgetClub(int $clubId): void
    {
        DB::table('club_member_roles')
            ->where('club_id', $clubId)
            ->distinct()
            ->pluck('user_id')
            ->each(fn($userId) => $this->forgetUser((int) $userId));
    }

    public function forgetAll(): void
    {
        Cache::forever(self::GLOBAL_VERSION_KEY, $this->globalVersion() + 1);
    }

    private function buildPermissionPayload(int $userId): array
    {
        /*
         * ==========================
         * SYSTEM ROLES
         * ==========================
         */
        $systemRoleSlugs = DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->where('club_member_roles.user_id', $userId)
            ->where('club_member_roles.is_active', true)
            ->whereNull('club_member_roles.deleted_at')
            ->whereNull('club_member_roles.club_id')
            ->where('roles.is_active', true)
            ->whereNull('roles.deleted_at')
            ->pluck('roles.slug');

        $payload = [
            'is_superadmin' => $systemRoleSlugs->contains('superadmin'),
            'is_system_admin' => $systemRoleSlugs->contains(
                fn($slug) => $slug !== 'superadmin'
            ),
            'system_permissions' => [],
            'club_permissions' => [],
            'club_roles' => [],
        ];

        /*
         * ==========================
         * SUPERADMIN
         * ==========================
         */
        if ($payload['is_superadmin']) {
            return $payload;
        }

        /*
         * ==========================
         * CLUB ROLES
         * ==========================
         */
        $clubRoles = DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->leftJoin('role_translations', function ($join) {
                $join->on('role_translations.role_id', '=', 'roles.id')
                    ->where('role_translations.locale', app()->getLocale())
                    ->whereNull('role_translations.deleted_at');
            })
            ->where('club_member_roles.user_id', $userId)
            ->where('club_member_roles.is_active', true)
            ->whereNull('club_member_roles.deleted_at')
            ->whereNotNull('club_member_roles.club_id')
            ->where('roles.is_active', true)
            ->whereNull('roles.deleted_at')
            ->select(
                'club_member_roles.club_id',
                'club_member_roles.role_id',
                'roles.slug as role_slug',
                'role_translations.name as role_name'
            )
            ->get();

        foreach ($clubRoles as $clubRole) {
            $clubId = (int) $clubRole->club_id;

            $payload['club_roles'][$clubId] = [
                'id' => (int) $clubRole->role_id,
                'slug' => $clubRole->role_slug,
                'name' => $clubRole->role_name,
            ];
        }

        /*
         * ==========================
         * PERMISSIONS
         * ==========================
         */
        $rows = DB::table('club_member_roles')
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
            ->whereNull('club_member_roles.deleted_at')
            ->select(
                'club_member_roles.club_id',
                'modules.slug as module',
                'permissions.action'
            )
            ->distinct()
            ->get();

        foreach ($rows as $row) {
            if ($row->club_id === null) {
                $payload['system_permissions'][$row->module][] = $row->action;
                continue;
            }

            $clubId = (int) $row->club_id;
            $payload['club_permissions'][$clubId][$row->module][] = $row->action;
        }

        return $payload;
    }

    private function globalVersion(): int
    {
        return (int) Cache::rememberForever(self::GLOBAL_VERSION_KEY, fn() => 1);
    }

    private function userVersion(int $userId): int
    {
        return (int) Cache::rememberForever($this->userVersionKey($userId), fn() => 1);
    }

    private function userVersionKey(int $userId): string
    {
        return "permissions:version:user:{$userId}";
    }
}
