<?php

use App\Domains\Club\Controllers\ClubMemberController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {

    // ── Join via invite link (user tự join, không cần permission đặc biệt) ──
    Route::post('/clubs/join', [ClubMemberController::class, 'join']);

    // ── Member management (chủ club quản lý) ─────────────────────────────
    Route::prefix('clubs/{clubSlug}/members')->group(function () {
        Route::get('/', [ClubMemberController::class, 'index'])->middleware('perm.club:club_member,view');
        Route::get('/select', [ClubMemberController::class, 'select'])->middleware('perm.club:club_member,view');
        Route::get('/{memberId}', [ClubMemberController::class, 'show'])->middleware('perm.club:club_member,view');
        Route::post('/{memberId}/approve', [ClubMemberController::class, 'approve'])->middleware('perm.club:club_member,update');
        Route::post('/{memberId}/reject', [ClubMemberController::class, 'reject'])->middleware('perm.club:club_member,update');
        Route::delete('/{memberId}', [ClubMemberController::class, 'destroy'])->middleware('perm.club:club_member,update');
    });
});
