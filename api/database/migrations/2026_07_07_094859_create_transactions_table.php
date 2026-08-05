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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('club_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('bank_account_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('webhook_config_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->enum('source', [
                'webhook',
                'cash',
                'manual',
            ]);

            $table->enum('type', [
                'income',
                'expense',
            ]);

            $table->decimal('amount', 15, 2);

            $table->decimal('balance', 15, 2)->nullable();

            $table->string('reference_code')->nullable();

            $table->string('sender_name')->nullable();

            $table->string('sender_account')->nullable();

            $table->text('description')->nullable();

            $table->dateTime('transaction_date');

            $table->json('raw_payload')->nullable();

            $table->integer('sort_order')->default(0);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['club_id', 'transaction_date']);
            $table->index('user_id');
            $table->index('type');
            $table->index('source');
            $table->index('reference_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
