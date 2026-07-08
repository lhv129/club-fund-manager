<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Tạo:
 *  1. User superadmin
 *  2. System role slug='superadmin' (club_id = null)
 *  3. club_member_roles (club_id = null) → user được nhận diện là SuperAdmin
 *
 * Chạy sau ModulePermissionSeeder.
 */
class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── 1. User ──────────────────────────────────────────────────────────
        $userId = DB::table('users')->insertGetId([
            'fullname'   => 'Super Admin',
            'username' => 'superadmin',
            'email'      => 'superadmin@gmail.com',
            'phone'      => '0983669129',
            'password'   => Hash::make('123456'),
            'status' => 'active',
            'email_verified_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ── 2. System role ───────────────────────────────────────────────────
        $roleId = DB::table('roles')->insertGetId([
            'club_id'    => null,       // null = system role, không thuộc club nào
            'slug'       => 'superadmin',
            'sort_order' => 0,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('role_translations')->insert([
            ['role_id' => $roleId, 'locale' => 'vi', 'name' => 'Quản trị hệ thống'],
            ['role_id' => $roleId, 'locale' => 'en', 'name' => 'Super Admin'],
        ]);

        // ── 3. Gán role cho user (club_id = null = system scope) ─────────────
        DB::table('club_member_roles')->insert([
            'club_id'    => null,
            'user_id'    => $userId,
            'role_id'    => $roleId,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->command->info("SuperAdmin created → email: superadmin@gmail.com / password: 123456");
    }
}
