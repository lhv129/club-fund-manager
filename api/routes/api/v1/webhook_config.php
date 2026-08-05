<?php

use App\Domains\Transaction\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {

    // Transactions — nested dưới clubs/{clubSlug}, cần perm.club
    Route::prefix('clubs/{clubSlug}/transactions')->group(function () {
        // Dynamic routes
        Route::get('/', [TransactionController::class, 'index'])
            ->middleware('perm.club:transaction,view');
    });
});
