<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Tạo:
 *  1. User manager
 *  2. Club demo
 *  3. Club role slug='manager' (club_id = club.id)
 *  4. Gán permissions cho role manager
 *  5. club_members  (user → club, status=approved)
 *  6. club_member_roles (user → role trong club)
 *
 * Chạy sau ModulePermissionSeeder.
 */
class ClubAndManagerSeeder extends Seeder
{
    /**
     * Permissions manager được phép trong club.
     * format: module_slug => [actions]
     */
    private array $managerPermissions = [
        'club'             => ['view'],
        'member'           => ['view', 'create', 'update', 'delete'],
        'role'             => ['view', 'create', 'update'],
        'fund'             => ['view', 'create', 'update'],
        'transaction'      => ['view', 'create', 'update'],
        'exchange_session' => ['view', 'create', 'update', 'delete'],
        'webhook'          => ['view'],
    ];

    public function run(): void
    {
        $now = now();

        // ── 1. User manager ───────────────────────────────────────────────────
        $userId = DB::table('users')->insertGetId([
            'fullname'   => 'Club Manager',
            'username' => 'manager',
            'email'      => 'manager@example.com',
            'phone'      => '0911111111',
            'password'   => Hash::make('123456'),
            'status' => 'active',
            'email_verified_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── 2. Club ───────────────────────────────────────────────────────────
        $clubId = DB::table('clubs')->insertGetId([
            'logo'       => null,
            'sort_order' => 1,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('club_translations')->insert([
            ['club_id' => $clubId, 'locale' => 'vi', 'name' => 'CLB Demo', 'description' => 'Câu lạc bộ cầu lông demo', 'slug' => 'clb-demo'],
            ['club_id' => $clubId, 'locale' => 'en', 'name' => 'Demo Club', 'description' => 'Demo badminton club', 'slug' => 'demo-club'],
        ]);

        // ── 3. Club role 'manager' ────────────────────────────────────────────
        $roleId = DB::table('roles')->insertGetId([
            'club_id'    => $clubId,    // club-scoped role
            'slug'       => 'manager',
            'sort_order' => 1,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('role_translations')->insert([
            ['role_id' => $roleId, 'locale' => 'vi', 'name' => 'Quản lý'],
            ['role_id' => $roleId, 'locale' => 'en', 'name' => 'Manager'],
        ]);

        // ── 4. Gán permissions cho role manager ──────────────────────────────
        $permissionIds = $this->resolvePermissionIds($this->managerPermissions);

        $rolePermissions = array_map(fn($pid) => [
            'role_id'       => $roleId,
            'permission_id' => $pid,
            'is_active'     => 1,
            'created_at'    => $now,
            'updated_at'    => $now,
        ], $permissionIds);

        DB::table('role_permissions')->insert($rolePermissions);

        // ── 5. Thêm user vào club (approved member) ───────────────────────────
        DB::table('club_members')->insert([
            'club_id'     => $clubId,
            'user_id'     => $userId,
            'join_type'   => 'request',
            'status'      => 'approved',
            'is_active'   => 1,
            'joined_at'   => $now,
            'reviewed_at' => $now,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // ── 6. Gán club role cho user ─────────────────────────────────────────
        DB::table('club_member_roles')->insert([
            'club_id'    => $clubId,
            'user_id'    => $userId,
            'role_id'    => $roleId,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->command->info("Club created     → slug: clb-demo (id: {$clubId})");
        $this->command->info("Manager created  → email: manager@example.com / password: 123456");
    }

    /**
     * Lấy permission IDs từ DB theo module slug + action.
     */
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
