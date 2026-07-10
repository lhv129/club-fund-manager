<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Tạo tất cả role templates (global) + gán permissions.
 * Không có club_id — scope nằm ở club_member_roles.club_id.
 * Chạy sau ModulePermissionSeeder.
 */
class RoleSeeder extends Seeder
{
    private array $roles = [
        [
            'slug'       => 'superadmin',
            'sort_order' => 0,
            'translations' => ['vi' => 'Quản trị hệ thống', 'en' => 'Super Admin'],
            'permissions' => [],
        ],
        [
            'slug'       => 'owner',
            'sort_order' => 1,
            'translations' => ['vi' => 'Chủ CLB', 'en' => 'Owner'],
            'permissions' => [
                'club'             => ['view', 'update', 'delete'],
                'member'           => ['view', 'create', 'update', 'delete'],
                'fund'             => ['view', 'create', 'update', 'delete'],
                'transaction'      => ['view', 'create', 'update', 'delete'],
                'exchange_session' => ['view', 'create', 'update', 'delete'],
                'webhook'          => ['view', 'create', 'update', 'delete'],
            ],
        ],
        [
            'slug'       => 'manager',
            'sort_order' => 2,
            'translations' => ['vi' => 'Quản lý', 'en' => 'Manager'],
            'permissions' => [
                'club'             => ['view'],
                'member'           => ['view', 'create', 'update', 'delete'],
                'fund'             => ['view', 'create', 'update'],
                'transaction'      => ['view', 'create', 'update'],
                'exchange_session' => ['view', 'create', 'update', 'delete'],
                'webhook'          => ['view'],
            ],
        ],
        [
            'slug'       => 'member',
            'sort_order' => 3,
            'translations' => ['vi' => 'Thành viên', 'en' => 'Member'],
            'permissions' => [
                'club'             => ['view'],
                'member'           => ['view'],
                'fund'             => ['view'],
                'transaction'      => ['view'],
                'exchange_session' => ['view'],
            ],
        ],
    ];

    public function run(): void
    {
        $now = now();

        foreach ($this->roles as $roleData) {
            $roleId = DB::table('roles')->insertGetId([
                'slug'       => $roleData['slug'],
                'sort_order' => $roleData['sort_order'],
                'is_active'  => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($roleData['translations'] as $locale => $name) {
                DB::table('role_translations')->insert([
                    'role_id' => $roleId,
                    'locale'  => $locale,
                    'name'    => $name,
                ]);
            }

            if (!empty($roleData['permissions'])) {
                $permissionIds = $this->resolvePermissionIds($roleData['permissions']);

                $rows = array_map(fn($pid) => [
                    'role_id'       => $roleId,
                    'permission_id' => $pid,
                    'is_active'     => 1,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ], $permissionIds);

                DB::table('role_permissions')->insert($rows);
            }

            $count = count($roleData['permissions'] ? $this->resolvePermissionIds($roleData['permissions']) : []);
            $this->command->info("Role [{$roleData['slug']}] created (id: {$roleId}) — {$count} permissions.");
        }
    }

    private function resolvePermissionIds(array $permissionMap): array
    {
        $ids = [];

        foreach ($permissionMap as $moduleSlug => $actions) {
            $moduleId = DB::table('modules')
                ->where('slug', $moduleSlug)
                ->value('id');

            if (!$moduleId) {
                $this->command->warn("Module [{$moduleSlug}] không tìm thấy — bỏ qua.");
                continue;
            }

            $found = DB::table('permissions')
                ->where('module_id', $moduleId)
                ->whereIn('action', $actions)
                ->pluck('id')
                ->toArray();

            $ids = array_merge($ids, $found);
        }

        return array_unique($ids);
    }
}
