<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('club_members', function (Blueprint $table) {
            // Thêm giá trị 'removed' vào enum status
            DB::statement("
                ALTER TABLE club_members
                MODIFY COLUMN status
                ENUM('pending', 'approved', 'rejected', 'removed')
                NOT NULL DEFAULT 'pending'
            ");

            // Người xóa thành viên
            $table->foreignId('removed_by')
                ->nullable()
                ->after('rejected_reason')
                ->constrained('users')
                ->nullOnDelete();

            // Thời điểm xóa thành viên
            $table->dateTime('removed_at')
                ->nullable()
                ->after('removed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('club_members', function (Blueprint $table) {
            //
        });
    }
};
