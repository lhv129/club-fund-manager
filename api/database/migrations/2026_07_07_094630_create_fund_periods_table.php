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
        Schema::create('fund_periods', function (Blueprint $table) {
            $table->id();

            $table->foreignId('club_id')
                ->constrained('clubs')
                ->cascadeOnDelete();

            $table->smallInteger('year');
            $table->tinyInteger('month');

            $table->decimal('male_amount', 15, 2)->default(0);
            $table->decimal('female_amount', 15, 2)->default(0);
            $table->decimal('exchange_amount', 15, 2)->default(0);

            $table->boolean('is_locked')->default(false);

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['club_id', 'year', 'month']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_periods');
    }
};
