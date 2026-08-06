<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('exchange_session_players', function (Blueprint $table) {
            // Giới tính người giao lưu — dùng để tính tổng thu theo đơn giá nam/nữ
            $table->enum('gender', ['male', 'female'])->nullable()->after('player_name');
            $table->index('gender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_session_players', function (Blueprint $table) {
            $table->dropIndex(['gender']);
            $table->dropColumn('gender');
        });
    }
};
