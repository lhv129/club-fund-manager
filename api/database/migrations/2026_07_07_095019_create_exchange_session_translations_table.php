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
        Schema::create('exchange_session_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exchange_session_id')->constrained('exchange_sessions')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['exchange_session_id', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_session_translations');
    }
};
