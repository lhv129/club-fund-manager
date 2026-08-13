<?php

namespace App\Services\Authorization;

use App\Domains\User\Models\User;

class PermissionService
{
    public function __construct(private PermissionCacheService $cache) {}

    public function hasPermission(User $user, string $module, string $action, ?int $clubId = null): bool
    {
        $payload = $this->cache->getPermissionPayload($user);

        if ($payload['is_superadmin'] || in_array($action, $payload['system_permissions'][$module] ?? [], true)) {
            return true;
        }

        return $clubId !== null
            && in_array($action, $payload['club_permissions'][$clubId][$module] ?? [], true);
    }

    public function isSuperAdmin(User $user): bool
    {
        return $this->cache->getPermissionPayload($user)['is_superadmin'];
    }

    public function isSystemAdmin(User $user): bool
    {
        return $this->cache->getPermissionPayload($user)['is_system_admin'];
    }

    public function permissionsGroupedByClub(User $user): array
    {
        $payload = $this->cache->getPermissionPayload($user);

        if ($payload['is_superadmin']) {
            return ['*'];
        }

        $permissions = $payload['system_permissions'];
        foreach ($payload['club_permissions'] as $clubId => $clubPermissions) {
            $permissions["club_{$clubId}"] = $clubPermissions;
        }

        return $permissions;
    }
}
