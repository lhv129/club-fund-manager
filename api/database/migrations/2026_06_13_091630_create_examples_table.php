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
        Schema::create('examples', function (Blueprint $table) {
            $table->id();
            // Khoá ngoại → bảng users
            // Xoá cascade: khi user bị xoá → example cũng bị xoá
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('title');
            // Slug tự sinh từ title — unique để URL đẹp
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            // Dùng is_active thay vì status boolean cho nhất quán với Base
            $table->boolean('is_active')->default(true)->index();
            // sort_order: dùng nếu cần kéo thả sắp xếp thứ tự
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
            $table->softDeletes(); // Xoá mềm — bỏ dòng này nếu không cần
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('examples');
    }
};
