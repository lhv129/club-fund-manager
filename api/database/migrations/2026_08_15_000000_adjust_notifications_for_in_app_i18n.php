<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['club_id']);
            $table->dropIndex(['club_id', 'user_id', 'is_read']);
            $table->foreignId('club_id')->nullable()->change();
            $table->foreign('club_id')->references('id')->on('clubs')->nullOnDelete();

            if (Schema::hasColumn('notifications', 'is_read')) {
                $table->dropColumn('is_read');
            }
            if (Schema::hasColumn('notifications', 'sort_order')) {
                $table->dropColumn('sort_order');
            }
            if (Schema::hasColumn('notifications', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type', 100)->change();
            $table->index(['user_id', 'read_at', 'created_at']);
            $table->index(['club_id', 'user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->boolean('is_read')->default(false);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->dropIndex(['user_id', 'read_at', 'created_at']);
            $table->dropIndex(['club_id', 'user_id', 'created_at']);
            $table->dropForeign(['club_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('club_id')->nullable(false)->change();
            $table->foreign('club_id')->references('id')->on('clubs')->cascadeOnDelete();
        });
    }
};
