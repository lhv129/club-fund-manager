<?php

use App\Domains\MonthlyContribution\Controllers\MonthlyContributionController;
use Illuminate\Support\Facades\Route;

// routes/api.php (thêm vào group auth.jwt)
Route::middleware('auth.jwt')->group(function () {
    Route::prefix('clubs/{clubSlug}/monthly-contributions')->group(function () {
        // Tĩnh trước
        Route::get('/cursor', [MonthlyContributionController::class, 'cursorIndex'])->middleware('perm.club:monthly_contribution,view');
        Route::get('/select', [MonthlyContributionController::class, 'select'])->middleware('perm.club:monthly_contribution,view');

        // Dynamic sau
        Route::get('/',[MonthlyContributionController::class, 'index'])->middleware('perm.club:monthly_contribution,view');
        Route::get('/{id}',[MonthlyContributionController::class, 'show'])->middleware('perm.club:monthly_contribution,view');
        Route::post('/',[MonthlyContributionController::class, 'store'])->middleware('perm.club:monthly_contribution,create');
        Route::put('/{id}',[MonthlyContributionController::class, 'update'])->middleware('perm.club:monthly_contribution,update');
        Route::delete('/{id}',[MonthlyContributionController::class, 'destroy'])->middleware('perm.club:monthly_contribution,delete');
    });
});