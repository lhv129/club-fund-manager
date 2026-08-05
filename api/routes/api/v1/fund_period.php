<?php

use App\Domains\FundPeriod\Controllers\FundPeriodController;
use Illuminate\Support\Facades\Route;


Route::middleware('auth.jwt')->group(function () {
    Route::prefix('clubs/{clubSlug}/fund-periods')->group(function () {
       // Tĩnh trước — bắt buộc đứng trước /{id}
    Route::get('/cursor',   [FundPeriodController::class, 'cursorIndex'])->middleware('perm.club:fund_period,view');
    Route::get('/select',   [FundPeriodController::class, 'select'])->middleware('perm.club:fund_period,view');

    // Dynamic sau
    Route::get('/', [FundPeriodController::class, 'index'])->middleware('perm.club:fund_period,view');
    Route::get('/{id}', [FundPeriodController::class, 'show'])->middleware('perm.club:fund_period,view');
    Route::post('/', [FundPeriodController::class, 'store'])->middleware('perm.club:fund_period,create');
    Route::put('/{id}',[FundPeriodController::class, 'update'])->middleware('perm.club:fund_period,update');
    Route::delete('/{id}',[FundPeriodController::class, 'destroy'])->middleware('perm.club:fund_period,delete');
    Route::patch('/{id}/toggle-status', [FundPeriodController::class, 'toggleStatus'])->middleware('perm.club:fund_period,update');
    });
});
