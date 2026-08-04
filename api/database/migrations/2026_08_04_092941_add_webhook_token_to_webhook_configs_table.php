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
        Schema::table('webhook_configs', function (Blueprint $table) {
            // Token dùng để nhận dạng URL, không phải secret ký HMAC
            $table->string('webhook_token', 64)->unique()->nullable()->after('webhook_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('webhook_configs', function (Blueprint $table) {
            //
        });
    }
};
