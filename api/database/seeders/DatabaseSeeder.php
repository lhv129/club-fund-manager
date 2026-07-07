<?php

namespace Database\Seeders;

use App\Domains\User\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ModulePermissionSeeder::class,  // 1. modules + permissions (system data)
            SuperAdminSeeder::class,         // 2. superadmin user + system role
            ClubAndManagerSeeder::class,     // 3. demo club + manager user
        ]);
    }
}
