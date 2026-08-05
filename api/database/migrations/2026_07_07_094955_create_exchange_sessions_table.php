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
        Schema::create('exchange_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('club_id')
                ->constrained('clubs')
                ->cascadeOnDelete();

            $table->foreignId('playing_schedule_id')
                ->nullable()
                ->constrained('playing_schedules')
                ->nullOnDelete();

            $table->foreignId('transaction_id')
                ->nullable()
                ->constrained('transactions')
                ->nullOnDelete();

            $table->date('session_date');

            $table->string('court_name')->nullable();
            $table->string('court_address')->nullable();

            $table->time('start_time');
            $table->time('end_time');

            $table->enum('type', ['scheduled', 'manual'])->default('scheduled');
            $table->enum('status', ['upcoming', 'completed', 'cancelled'])->default('upcoming');

            $table->integer('player_count')->default(0);
            $table->decimal('amount_per_player', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['club_id', 'session_date']);
            $table->index('playing_schedule_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_sessions');
    }
};
