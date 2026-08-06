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
        Schema::table('exchange_sessions', function (Blueprint $table) {
            // Snapshot đơn giá giao lưu từ FundPeriod khi chốt buổi — tránh sai lệch lịch sử
            $table->decimal('exchange_male_amount', 15, 2)->default(0)->after('total_amount');
            $table->decimal('exchange_female_amount', 15, 2)->default(0)->after('exchange_male_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_sessions', function (Blueprint $table) {
            $table->dropColumn('exchange_female_amount');
            $table->dropColumn('exchange_male_amount');
        });
    }
};
