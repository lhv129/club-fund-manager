<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Tạo tài khoản superadmin.
 * Role 'superadmin' đã có từ RoleSeeder — chỉ lấy id.
 * Chạy sau RoleSeeder.
 */
class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $superadminRoleId = DB::table('roles')
            ->where('slug', 'superadmin')
            ->value('id');

        $userId = DB::table('users')->insertGetId([
            'fullname'          => 'Super Admin',
            'username'          => 'superadmin',
            'email'             => 'superadmin@gmail.com',
            'phone'             => '0983669129',
            'password'          => Hash::make('123456'),
            'status'            => 'active',
            'email_verified_at' => $now,
            'created_at'        => $now,
            'updated_at'        => $now,
        ]);

        // club_id = null → system scope → bypass mọi permission check
        DB::table('club_member_roles')->insert([
            'club_id'    => null,
            'user_id'    => $userId,
            'role_id'    => $superadminRoleId,
            'is_active'  => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->command->info("SuperAdmin created → email: superadmin@gmail.com / password: 123456");
    }
}
