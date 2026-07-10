<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ModulePermissionSeeder::class,  // 1. modules + permissions
            RoleSeeder::class,              // 2. role templates + role_permissions
            SuperAdminSeeder::class,        // 3. superadmin user
            ClubAndManagerSeeder::class,    // 4. club demo + manager user
        ]);
    }
}
