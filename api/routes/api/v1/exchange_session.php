<?php

use App\Domains\ExchangeSession\Controllers\ExchangeSessionController;
use App\Domains\ExchangeSession\Controllers\ExchangeSessionPlayerController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('exchange-sessions')->group(function () {
        // Tĩnh trước — bắt buộc đứng trước /{id}
        Route::get('/cursor',   [ExchangeSessionController::class, 'cursorIndex'])->middleware('perm.club:exchange_session,view');
        Route::get('/select',   [ExchangeSessionController::class, 'select'])->middleware('perm.club:exchange_session,view');
        Route::get('/players', [ExchangeSessionController::class, 'players'])->middleware('perm.club:exchange_session_player,view');

        // Dynamic sau
        Route::get('/', [ExchangeSessionController::class, 'index'])->middleware('perm.club:exchange_session,view');
        Route::get('/{id}', [ExchangeSessionController::class, 'show'])->middleware('perm.club:exchange_session,view');
        Route::post('/', [ExchangeSessionController::class, 'store'])->middleware('perm.club:exchange_session,create');
        Route::put('/{id}', [ExchangeSessionController::class, 'update'])->middleware('perm.club:exchange_session,update');
        Route::delete('/{id}', [ExchangeSessionController::class, 'destroy'])->middleware('perm.club:exchange_session,delete');
        Route::put('/{id}/toggle-status', [ExchangeSessionController::class, 'toggleStatus'])->middleware('perm.club:exchange_session,update');
        Route::put('/{id}/complete', [ExchangeSessionController::class, 'complete'])->middleware('perm.club:exchange_session,update');


        // Dynamic sau
        // Sub-resource: players của 1 session
        Route::get('/{sessionId}/players/{id}', [ExchangeSessionPlayerController::class, 'show'])->middleware('perm.club:exchange_session,view');
        Route::post('/{sessionId}/players', [ExchangeSessionPlayerController::class, 'store'])->middleware('perm.club:exchange_session,update');
        Route::put('/{sessionId}/players/{id}', [ExchangeSessionPlayerController::class, 'update'])->middleware('perm.club:exchange_session,update');
        Route::delete('/{sessionId}/players/{id}', [ExchangeSessionPlayerController::class, 'destroy'])->middleware('perm.club:exchange_session,update');
        Route::put('/{sessionId}/players/{id}/toggle-paid',   [ExchangeSessionPlayerController::class, 'togglePaid'])->middleware('perm.club:exchange_session,update');
    });
});
