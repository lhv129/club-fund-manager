<?php

use App\Domains\FundPeriod\Controllers\FundPeriodController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('fund-periods')->group(function () {

        // ============================================================
        // STATIC ROUTES
        // ============================================================

        Route::get('/cursor', [FundPeriodController::class, 'cursorIndex'])
            ->middleware('perm.club:fund_period,view');

        Route::get('/select', [FundPeriodController::class, 'select'])
            ->middleware('perm.club:fund_period,view');

        Route::get('/trashed', [FundPeriodController::class, 'trashed'])
            ->middleware('perm.club:fund_period,view');

        // ============================================================
        // LIST
        // ============================================================

        Route::get('/', [FundPeriodController::class, 'index'])
            ->middleware('perm.club:fund_period,view');

        // ============================================================
        // CREATE
        // ============================================================

        Route::post('/', [FundPeriodController::class, 'store'])
            ->middleware('perm.club:fund_period,create');

        // ============================================================
        // ACTIONS
        // ============================================================

        Route::post('/{id}/restore', [FundPeriodController::class, 'restore'])
            ->middleware('perm.club:fund_period,update');

        Route::post('/{id}/close', [FundPeriodController::class, 'close'])
            ->middleware('perm.club:fund_period,update');

        Route::post('/{id}/reopen', [FundPeriodController::class, 'reopen'])
            ->middleware('perm.club:fund_period,update');

        Route::post('/{id}/toggle-status', [FundPeriodController::class, 'toggleStatus'])
            ->middleware('perm.club:fund_period,update');

        // ============================================================
        // DETAIL
        // ============================================================

        Route::get('/{id}', [FundPeriodController::class, 'show'])
            ->middleware('perm.club:fund_period,view');

        // ============================================================
        // UPDATE
        // ============================================================

        Route::put('/{id}', [FundPeriodController::class, 'update'])
            ->middleware('perm.club:fund_period,update');

        // ============================================================
        // DELETE
        // ============================================================

        Route::delete('/{id}', [FundPeriodController::class, 'destroy'])
            ->middleware('perm.club:fund_period,delete');
    });
});
