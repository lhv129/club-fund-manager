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
        Schema::create('member_payment_codes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('monthly_contribution_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('payment_code', 8)->unique();

            $table->enum('status', [
                'pending',
                'used',
                'expired',
            ])->default('pending');

            $table->timestamp('expired_at')->nullable();
            $table->timestamp('used_at')->nullable();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('expired_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_payment_codes');
    }
};
