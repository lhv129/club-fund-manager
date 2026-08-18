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
            'slug'       => 'club_member',
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
            'slug'       => 'fund_period',
            'sort_order' => 4,
            'translations' => [
                'vi' => ['name' => 'Kỳ quỹ'],
                'en' => ['name' => 'Fund Period'],
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
            'slug' => 'exchange_session_player',
            'sort_order' => 6,
            'translations' => [
                'vi' => ['name' => 'Thống kê giao lưu'],
                'en' => ['name' => 'Exchange Statistics'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'playing_schedule',
            'sort_order' => 7,
            'translations' => [
                'vi' => ['name' => 'Lịch đánh'],
                'en' => ['name' => 'Playing Schedule'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug' => 'member_payment_code',
            'sort_order' => 8,
            'translations' => [
                'vi' => ['name' => 'Mã thanh toán'],
                'en' => ['name' => 'Payment Code'],
            ],
            'actions' => ['view', 'create'],
        ],
        [
            'slug'       => 'bank_account',
            'sort_order' => 10,
            'translations' => [
                'vi' => ['name' => 'Tài khoản ngân hàng'],
                'en' => ['name' => 'Bank Account'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'club_invite',
            'sort_order' => 11,
            'translations' => [
                'vi' => ['name' => 'Mời thành viên'],
                'en' => ['name' => 'Invite Member'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'webhook',
            'sort_order' => 9,
            'translations' => [
                'vi' => ['name' => 'Webhook'],
                'en' => ['name' => 'Webhook'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'webhook_config',
            'sort_order' => 12,
            'translations' => [
                'vi' => ['name' => 'Cấu hình webhook'],
                'en' => ['name' => 'Webhook Configuration'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'modules',
            'sort_order' => 13,
            'translations' => [
                'vi' => ['name' => 'Modules'],
                'en' => ['name' => 'Modules'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
        [
            'slug'       => 'monthly_contribution',
            'sort_order' => 14,
            'translations' => [
                'vi' => ['name' => 'Đóng quỹ hàng tháng'],
                'en' => ['name' => 'Monthly Contribution'],
            ],
            'actions' => ['view', 'create', 'update', 'delete'],
        ],
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
                DB::table('permissions')->insert([
                    'module_id'  => $moduleId,
                    'action'     => $action,
                    'sort_order' => $sortAction + 1,
                    'is_active'  => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
