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
        Schema::table('club_members', function (Blueprint $table) {
            $table->unsignedBigInteger('banned_by')
                ->nullable()
                ->after('removed_by');

            $table->timestamp('banned_at')
                ->nullable()
                ->after('banned_by');

            $table->text('banned_reason')
                ->nullable()
                ->after('banned_at');

            $table->index('banned_by');

            $table->foreign('banned_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
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
