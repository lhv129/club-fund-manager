<?php

use App\Domains\Club\Controllers\ClubInviteController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('clubs/{clubId}/invites')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [ClubInviteController::class, 'index'])->middleware('permission:club,update');
    Route::get('/{id}', [ClubInviteController::class, 'show'])->middleware('permission:club,update');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [ClubInviteController::class, 'store'])->middleware('permission:club,update');
    Route::delete('/{id}', [ClubInviteController::class, 'destroy'])->middleware('permission:club,update');
    Route::post('/{id}/toggle-status', [ClubInviteController::class, 'toggleStatus'])->middleware('permission:club,update');
});
