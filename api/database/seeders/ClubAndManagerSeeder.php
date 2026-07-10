<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Tạo club demo + tài khoản manager.
 * Role 'manager' đã có từ RoleSeeder — chỉ lấy id, không tạo lại.
 * Chạy sau RoleSeeder.
 */
class ClubAndManagerSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $managerRoleId = DB::table('roles')
            ->where('slug', 'manager')
            ->value('id');

        // ── User manager ──────────────────────────────────────────────────
        $userId = DB::table('users')->insertGetId([
            'fullname'          => 'Club Manager',
            'username'          => 'manager',
            'email'             => 'manager@example.com',
            'phone'             => '0911111111',
            'password'          => Hash::make('123456'),
            'status'            => 'active',
            'email_verified_at' => $now,
            'created_at'        => $now,
            'updated_at'        => $now,
        ]);

        // ── Club demo ─────────────────────────────────────────────────────
        $clubId = DB::table('clubs')->insertGetId([
            'logo'       => null,
            'sort_order' => 1,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('club_translations')->insert([
            ['club_id' => $clubId, 'locale' => 'vi', 'name' => 'CLB Demo',  'description' => 'Câu lạc bộ cầu lông demo', 'slug' => 'clb-demo'],
            ['club_id' => $clubId, 'locale' => 'en', 'name' => 'Demo Club', 'description' => 'Demo badminton club',       'slug' => 'demo-club'],
        ]);

        // ── club_members ──────────────────────────────────────────────────
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

        // ── Gán role manager trong club này ───────────────────────────────
        DB::table('club_member_roles')->insert([
            'club_id'    => $clubId,
            'user_id'    => $userId,
            'role_id'    => $managerRoleId,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->command->info("Club created    → slug: clb-demo (id: {$clubId})");
        $this->command->info("Manager created → email: manager@example.com / password: 123456");
    }
}
