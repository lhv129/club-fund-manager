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
        Schema::create('fund_period_translations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('fund_period_id')
                ->constrained('fund_periods')
                ->cascadeOnDelete();

            $table->string('locale', 5);
            $table->string('title');
            $table->text('description')->nullable();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['fund_period_id', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_period_translations');
    }
};
