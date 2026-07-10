<?php

use App\Domains\Club\Controllers\ClubMemberController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {

    // ── Join via invite link (user tự join, không cần permission đặc biệt) ──
    Route::post('/clubs/join', [ClubMemberController::class, 'join']);

    // ── Member management (chủ club quản lý) ─────────────────────────────
    Route::prefix('clubs/{clubId}/members')->group(function () {
        Route::get('/', [ClubMemberController::class, 'index'])->middleware('permission:club,view');
        Route::get('/{memberId}', [ClubMemberController::class, 'show'])->middleware('permission:club,view');
        Route::post('/{memberId}/approve', [ClubMemberController::class, 'approve'])->middleware('permission:club,update');
        Route::post('/{memberId}/reject', [ClubMemberController::class, 'reject'])->middleware('permission:club,update');
        Route::delete('/{memberId}', [ClubMemberController::class, 'destroy'])->middleware('permission:club,update');
        Route::post('/{memberId}/toggle-status', [ClubMemberController::class, 'toggleStatus'])->middleware('permission:club,update');
    });
});
