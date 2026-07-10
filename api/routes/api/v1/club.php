<?php

use App\Domains\Club\Controllers\ClubController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('clubs')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [ClubController::class, 'index'])->middleware('permission:club,view');
    Route::get('/cursor', [ClubController::class, 'cursorIndex'])->middleware('permission:club,view');
    Route::get('/select', [ClubController::class, 'select'])->middleware('permission:club,view');
    Route::get('/slug/{slug}',  [ClubController::class, 'showBySlug'])->middleware('permission:club,view');
    Route::get('/{id}', [ClubController::class, 'show'])->middleware('permission:club,view');

    // ── Write (chỉ Superadmin) ────────────────────────────────────────────
    Route::post('/', [ClubController::class, 'store'])->middleware('permission:club,create');
    Route::put('/{id}', [ClubController::class, 'update'])->middleware('permission:club,update');
    Route::delete('/{id}', [ClubController::class, 'destroy'])->middleware('permission:club,delete');
    Route::post('/{id}/toggle-status', [ClubController::class, 'toggleStatus'])->middleware('permission:club,update');
    Route::put('/{id}/owner', [ClubController::class, 'updateOwner'])->middleware('permission:club,update');
});
