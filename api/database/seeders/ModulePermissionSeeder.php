<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed toàn bộ modules + permissions (system data).
 * Chạy trước tất cả seeders khác.
 */
class ModulePermissionSeeder extends Seeder
{
    /**
     * Định nghĩa modules và actions của từng module.
     * action 'view' | 'create' | 'update' | 'delete'
     */
    private array $modules = [
        [
            'slug'       => 'club',
            'sort_order' => 1,
            'translations' => [
                'vi' => ['name' => 'Câu lạc bộ'],
                'en' => ['name' => 'Club'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'member',
            'sort_order' => 2,
            'translations' => [
                'vi' => ['name' => 'Thành viên'],
                'en' => ['name' => 'Member'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'role',
            'sort_order' => 3,
            'translations' => [
                'vi' => ['name' => 'Vai trò'],
                'en' => ['name' => 'Role'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'fund',
            'sort_order' => 4,
            'translations' => [
                'vi' => ['name' => 'Quỹ'],
                'en' => ['name' => 'Fund'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'transaction',
            'sort_order' => 5,
            'translations' => [
                'vi' => ['name' => 'Giao dịch'],
                'en' => ['name' => 'Transaction'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'exchange_session',
            'sort_order' => 6,
            'translations' => [
                'vi' => ['name' => 'Buổi đánh'],
                'en' => ['name' => 'Exchange Session'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'webhook',
            'sort_order' => 7,
            'translations' => [
                'vi' => ['name' => 'Webhook'],
                'en' => ['name' => 'Webhook'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
    ];

    private array $actionLabels = [
        'vi' => ['view' => 'Xem', 'create' => 'Tạo mới', 'update' => 'Chỉnh sửa', 'delete' => 'Xóa'],
        'en' => ['view' => 'View', 'create' => 'Create', 'update' => 'Update', 'delete' => 'Delete'],
    ];

    public function run(): void
    {
        $now = now();

        foreach ($this->modules as $sort => $moduleData) {
            // Upsert module
            $moduleId = DB::table('modules')->insertGetId([
                'slug'       => $moduleData['slug'],
                'sort_order' => $moduleData['sort_order'],
                'is_active'  => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Translations cho module
            foreach ($moduleData['translations'] as $locale => $trans) {
                DB::table('module_translations')->insert([
                    'module_id' => $moduleId,
                    'locale'    => $locale,
                    'name'      => $trans['name'],
                ]);
            }

            // Permissions của module
            foreach ($moduleData['actions'] as $sortAction => $action) {
                $permissionId = DB::table('permissions')->insertGetId([
                    'module_id'  => $moduleId,
                    'action'     => $action,
                    'sort_order' => $sortAction + 1,
                    'is_active'  => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                // Translations cho permission
                foreach (['vi', 'en'] as $locale) {
                    DB::table('permission_translations')->insert([
                        'permission_id' => $permissionId,
                        'locale'        => $locale,
                        'name'          => $this->actionLabels[$locale][$action],
                    ]);
                }
            }
        }
    }
}
