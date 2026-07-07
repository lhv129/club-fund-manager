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
        Schema::table('club_member_roles', function (Blueprint $table) {
            // Bỏ foreign key cũ trước khi đổi nullable
            $table->dropForeign(['club_id']);

            // Nullable để superadmin dùng club_id = null (system scope)
            $table->unsignedBigInteger('club_id')->nullable()->change();

            // Thêm lại foreign key với nullable
            $table->foreign('club_id')
                ->references('id')
                ->on('clubs')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('club_member_roles', function (Blueprint $table) {
            //
        });
    }
};
