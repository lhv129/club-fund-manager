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

        return Cache::remember(
            $key,
            self::TTL_SECONDS,
            fn() => $this->buildPermissionPayload($user->id)
        );
    }

    /**
     * Invalidate permission cache for one user.
     */
    public function forgetUser(int $userId): void
    {
        Cache::forever(
            $this->userVersionKey($userId),
            $this->userVersion($userId) + 1
        );
    }

    /**
     * Invalidate permission cache for all users having this role.
     */
    public function forgetUsersForRole(int $roleId): void
    {
        DB::table('club_member_roles')
            ->where('role_id', $roleId)
            ->distinct()
            ->pluck('user_id')
            ->each(
                fn($userId) => $this->forgetUser((int) $userId)
            );
    }

    /**
     * Invalidate permission cache for all members of a club.
     */
    public function forgetClub(int $clubId): void
    {
        DB::table('club_member_roles')
            ->where('club_id', $clubId)
            ->distinct()
            ->pluck('user_id')
            ->each(
                fn($userId) => $this->forgetUser((int) $userId)
            );
    }

    /**
     * Invalidate all permission caches.
     */
    public function forgetAll(): void
    {
        Cache::forever(
            self::GLOBAL_VERSION_KEY,
            $this->globalVersion() + 1
        );
    }

    /**
     * Build permission payload for one user.
     *
     * Structure:
     *
     * [
     *     'is_superadmin' => bool,
     *     'is_system_admin' => bool,
     *
     *     'system_role' => [
     *         'id' => int,
     *         'slug' => string,
     *         'name' => string|null,
     *     ]|null,
     *
     *     'system_permissions' => [
     *         'module' => ['view', 'create', ...]
     *     ],
     *
     *     'club_permissions' => [
     *         clubId => [
     *             'module' => ['view', 'create', ...]
     *         ]
     *     ],
     *
     *     'club_roles' => [
     *         clubId => [
     *             'id' => int,
     *             'slug' => string,
     *             'name' => string|null,
     *         ]
     *     ],
     * ]
     */
    private function buildPermissionPayload(int $userId): array
    {
        /*
         * ==========================================================
         * SYSTEM ROLE
         * ==========================================================
         *
         * Global role:
         *
         * club_id = NULL
         *
         * Business rule:
         * One user has maximum one global/system role.
         */

        $systemRole = DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->leftJoin('role_translations', function ($join) {
                $join->on(
                    'role_translations.role_id',
                    '=',
                    'roles.id'
                )
                    ->where(
                        'role_translations.locale',
                        app()->getLocale()
                    )
                    ->whereNull('role_translations.deleted_at');
            })
            ->where('club_member_roles.user_id', $userId)
            ->where('club_member_roles.is_active', true)
            ->whereNull('club_member_roles.deleted_at')
            ->whereNull('club_member_roles.club_id')
            ->where('roles.is_active', true)
            ->whereNull('roles.deleted_at')
            ->select(
                'roles.id',
                'roles.slug',
                'role_translations.name as role_name'
            )
            ->first();

        $isSuperAdmin = $systemRole?->slug === 'superadmin';

        /*
         * System admin means user has a global role
         * which is not superadmin.
         *
         * If your system has a specific slug such as
         * "system_admin", you can change this to:
         *
         * $isSystemAdmin = $systemRole?->slug === 'system_admin';
         */
        $isSystemAdmin = $systemRole !== null && !$isSuperAdmin;

        $payload = [
            'is_superadmin' => $isSuperAdmin,

            'is_system_admin' => $isSystemAdmin,

            /*
             * Global role.
             *
             * null for users without a global role.
             */
            'system_role' => $systemRole
                ? [
                    'id' => (int) $systemRole->id,
                    'slug' => $systemRole->slug,
                    'name' => $systemRole->role_name,
                ]
                : null,

            /*
             * Global/system permissions.
             */
            'system_permissions' => [],

            /*
             * Club permissions grouped by club ID.
             */
            'club_permissions' => [],

            /*
             * Club roles grouped by club ID.
             */
            'club_roles' => [],
        ];

        /*
         * ==========================================================
         * SUPERADMIN
         * ==========================================================
         *
         * Superadmin does not need to load all permissions.
         * PermissionService will treat it as wildcard.
         */
        if ($payload['is_superadmin']) {
            return $payload;
        }

        /*
         * ==========================================================
         * CLUB ROLES
         * ==========================================================
         */

        $clubRoles = DB::table('club_member_roles')
            ->join(
                'roles',
                'roles.id',
                '=',
                'club_member_roles.role_id'
            )
            ->leftJoin('role_translations', function ($join) {
                $join->on(
                    'role_translations.role_id',
                    '=',
                    'roles.id'
                )
                    ->where(
                        'role_translations.locale',
                        app()->getLocale()
                    )
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
         * ==========================================================
         * PERMISSIONS
         * ==========================================================
         *
         * The query gets permissions from both:
         *
         * 1. Global/system role
         *    club_id = NULL
         *
         * 2. Club role
         *    club_id = specific club
         */

        $rows = DB::table('club_member_roles')
            ->join('roles', function ($join) {
                $join->on(
                    'roles.id',
                    '=',
                    'club_member_roles.role_id'
                )
                    ->where('roles.is_active', true)
                    ->whereNull('roles.deleted_at');
            })
            ->join('role_permissions', function ($join) {
                $join->on(
                    'role_permissions.role_id',
                    '=',
                    'roles.id'
                )
                    ->where('role_permissions.is_active', true)
                    ->whereNull('role_permissions.deleted_at');
            })
            ->join('permissions', function ($join) {
                $join->on(
                    'permissions.id',
                    '=',
                    'role_permissions.permission_id'
                )
                    ->where('permissions.is_active', true)
                    ->whereNull('permissions.deleted_at');
            })
            ->join('modules', function ($join) {
                $join->on(
                    'modules.id',
                    '=',
                    'permissions.module_id'
                )
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
            /*
             * Global/system permission.
             */
            if ($row->club_id === null) {
                $payload['system_permissions'][$row->module][] = $row->action;

                continue;
            }

            /*
             * Club permission.
             */
            $clubId = (int) $row->club_id;

            $payload['club_permissions']
                [$clubId]
                [$row->module][]
                = $row->action;
        }

        return $payload;
    }

    private function globalVersion(): int
    {
        return (int) Cache::rememberForever(
            self::GLOBAL_VERSION_KEY,
            fn() => 1
        );
    }

    private function userVersion(int $userId): int
    {
        return (int) Cache::rememberForever(
            $this->userVersionKey($userId),
            fn() => 1
        );
    }

    private function userVersionKey(int $userId): string
    {
        return "permissions:version:user:{$userId}";
    }
}