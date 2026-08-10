<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_funds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->unique()->constrained('clubs')->cascadeOnDelete();
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamps();
        });

        DB::table('clubs')->select('id')->orderBy('id')->chunkById(100, function ($clubs) {
            $now = now();
            $rows = $clubs->map(function ($club) use ($now) {
                $income = DB::table('transactions')
                    ->where('club_id', $club->id)
                    ->whereNull('deleted_at')
                    ->where('type', 'income')
                    ->sum('amount');
                $expense = DB::table('transactions')
                    ->where('club_id', $club->id)
                    ->whereNull('deleted_at')
                    ->where('type', 'expense')
                    ->sum('amount');

                return [
                    'club_id' => $club->id,
                    'balance' => $income - $expense,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();

            DB::table('club_funds')->insert($rows);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_funds');
    }
};
