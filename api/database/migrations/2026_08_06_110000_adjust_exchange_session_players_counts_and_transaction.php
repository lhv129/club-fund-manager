<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Định nghĩa lại exchange_session_players theo thiết kế giao lưu mới:
     *   - Bỏ gender (enum) — sai ý thiết kế.
     *   - Thêm male / female (số lượng người nam/nữ trong nhóm giao lưu).
     *   - Thêm transaction_id (FK nullable) — admin gắn tay để set paid=1.
     *
     * Mỗi dòng = 1 "nhóm giao lưu" do 1 member (user_id) mang đến, hoặc người lạ
     * (user_id=NULL, player_name = JSON mảng tên). amount tự tính =
     * male×exchange_male_amount + female×exchange_female_amount.
     */
    public function up(): void
    {
        Schema::table('exchange_session_players', function (Blueprint $table) {
            // Bỏ gender (enum) added ở migration trước
            if (Schema::hasColumn('exchange_session_players', 'gender')) {
                $table->dropIndex(['gender']);
                $table->dropColumn('gender');
            }

            // Số lượng nam/nữ trong nhóm giao lưu
            $table->unsignedSmallInteger('male')->default(0)->after('player_name');
            $table->unsignedSmallInteger('female')->default(0)->after('male');

            // FK tới transactions — admin gắn tay để đối soát paid
            $table->foreignId('transaction_id')
                ->nullable()
                ->after('user_id')
                ->constrained('transactions')
                ->nullOnDelete();

            $table->index('transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_session_players', function (Blueprint $table) {
            $table->dropForeign(['transaction_id']);
            $table->dropIndex(['transaction_id']);
            $table->dropColumn('transaction_id');
            $table->dropColumn('female');
            $table->dropColumn('male');

            // Khôi phục gender (theo migration trước)
            $table->enum('gender', ['male', 'female'])->nullable()->after('player_name');
            $table->index('gender');
        });
    }
};
