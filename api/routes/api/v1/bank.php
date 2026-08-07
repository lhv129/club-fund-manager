<?php

use App\Domains\Bank\Controllers\BankController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('banks')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [BankController::class, 'index'])
        ->middleware('perm.system:bank,view');

    Route::get('/cursor', [BankController::class, 'cursorIndex'])
        ->middleware('perm.system:bank,view');

    Route::get('/select', [BankController::class, 'select']);

    Route::get('/{id}', [BankController::class, 'show'])
        ->middleware('perm.system:bank,view');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [BankController::class, 'store'])
        ->middleware('perm.system:bank,create');

    Route::put('/{id}', [BankController::class, 'update'])
        ->middleware('perm.system:bank,update');

    Route::delete('/{id}', [BankController::class, 'destroy'])
        ->middleware('perm.system:bank,delete');

    Route::post('/{id}/toggle-status', [BankController::class, 'toggleStatus'])
        ->middleware('perm.system:bank,update');
});
