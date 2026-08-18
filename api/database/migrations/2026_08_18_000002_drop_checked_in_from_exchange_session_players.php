<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exchange_session_players', function (Blueprint $table) {
            $table->dropColumn('checked_in');
        });
    }

    public function down(): void
    {
        Schema::table('exchange_session_players', function (Blueprint $table) {
            $table->boolean('checked_in')->default(false)->after('paid');
        });
    }
};
