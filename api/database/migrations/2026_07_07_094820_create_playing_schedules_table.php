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
        Schema::create('playing_schedules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('club_id')
                ->constrained('clubs')
                ->cascadeOnDelete();

            $table->tinyInteger('weekday');          // 0 = Sunday ... 6 = Saturday

            $table->string('court_name')->nullable();
            $table->string('court_address')->nullable();

            $table->time('start_time');
            $table->time('end_time');

            $table->boolean('auto_generate')->default(true);
            $table->integer('weeks_ahead')->default(8);

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['club_id', 'weekday']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('playing_schedules');
    }
};
