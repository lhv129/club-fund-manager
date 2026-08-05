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
        Schema::create('monthly_contributions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('club_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('period_id')
                ->constrained('fund_periods')
                ->cascadeOnDelete();

            $table->foreignId('transaction_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->decimal('amount', 15, 2);

            $table->enum('status', [
                'pending',
                'paid',
                'cancelled',
            ])->default('pending');

            $table->enum('paid_by', [
                'bank',
                'cash',
                'manual',
            ])->nullable();

            $table->timestamp('payment_date')->nullable();

            $table->integer('sort_order')->default(0);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->unique([
                'club_id',
                'user_id',
                'period_id',
            ]);

            $table->index('period_id');
            $table->index('status');
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_contributions');
    }
};
