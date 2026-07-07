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
        Schema::create('club_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained('clubs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // --- Join flow ---
            $table->enum('join_type', ['request', 'invite'])->default('request');
            // request = tự xin vào | invite = vào qua link mời
            $table->foreignId('invite_id')->nullable()->constrained('club_invites')->nullOnDelete();
            // link invite đã dùng để vào (nếu join_type = invite)
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            // admin đã duyệt / từ chối
            $table->dateTime('reviewed_at')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->dateTime('joined_at')->nullable(); // set khi status = approved
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['club_id', 'user_id']);
            $table->index(['club_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('club_members');
    }
};
