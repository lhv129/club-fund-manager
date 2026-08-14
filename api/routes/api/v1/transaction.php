<?php

use App\Domains\Transaction\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {

    Route::prefix('transactions')->group(function () {
        // Dynamic routes
        Route::get('/', [TransactionController::class, 'index'])
            ->middleware('perm.club:transaction,view');
        Route::get('/select', [TransactionController::class, 'select'])
            ->middleware('perm.club:transaction,view');
        Route::get('/{id}', [TransactionController::class, 'show'])
            ->middleware('perm.club:transaction,view');
        Route::put('/{id}', [TransactionController::class, 'update'])
            ->middleware('perm.club:transaction,update');
    });
});
