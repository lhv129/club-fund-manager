<?php

use App\Domains\Club\Controllers\ClubInviteController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('clubs/{clubSlug}/invites')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [ClubInviteController::class, 'index'])->middleware('perm.club:club_invite,view');
    Route::get('/{id}', [ClubInviteController::class, 'show'])->middleware('perm.club:club_invite,view');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [ClubInviteController::class, 'store'])->middleware('perm.club:club_invite,create');
    Route::delete('/{id}', [ClubInviteController::class, 'destroy'])->middleware('perm.club:club_invite,update');
    Route::post('/{id}/toggle-status', [ClubInviteController::class, 'toggleStatus'])->middleware('perm.club:club_invite,update');
});
