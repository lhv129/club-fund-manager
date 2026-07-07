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
        Schema::create('club_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            // admin tạo link invite
            $table->string('token', 64)->unique();
            // token ngẫu nhiên, dùng để tạo URL: /clubs/join?token=xxx
            $table->dateTime('expires_at')->nullable();
            // null = không giới hạn số lượt dùng
            $table->unsignedInteger('used_count')->default(0);
            // đếm số người đã dùng link này
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['club_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('club_invites');
    }
};
