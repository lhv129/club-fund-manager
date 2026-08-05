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
        Schema::create('exchange_session_players', function (Blueprint $table) {
            $table->id();

            $table->foreignId('exchange_session_id')
                ->constrained('exchange_sessions')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('player_name')->nullable();   // dùng khi khách ngoài (user_id = null)

            $table->decimal('amount', 15, 2)->default(0);
            $table->boolean('paid')->default(false);
            $table->boolean('checked_in')->default(false);

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('exchange_session_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_session_players');
    }
};
