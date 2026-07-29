<?php

use App\Domains\Club\Controllers\ClubInviteController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('clubs/{clubSlug}/invites')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [ClubInviteController::class, 'index'])->middleware('perm.system:club,update');
    Route::get('/{id}', [ClubInviteController::class, 'show'])->middleware('perm.system:club,update');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [ClubInviteController::class, 'store'])->middleware('perm.system:club,update');
    Route::delete('/{id}', [ClubInviteController::class, 'destroy'])->middleware('perm.system:club,update');
    Route::post('/{id}/toggle-status', [ClubInviteController::class, 'toggleStatus'])->middleware('perm.system:club,update');
});
