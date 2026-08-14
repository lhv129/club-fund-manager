<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('monthly_contributions')
            ->where('paid_by', 'manual')
            ->update(['paid_by' => 'cash']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE monthly_contributions MODIFY paid_by ENUM('bank', 'cash') NULL"
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE monthly_contributions MODIFY paid_by ENUM('bank', 'cash', 'manual') NULL"
            );
        }
    }
};
