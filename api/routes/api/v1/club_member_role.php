<?php

use App\Domains\ClubMemberRole\Controllers\ClubMemberRoleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('/club-member-roles')->group(function () {
        Route::put('/sync', [ClubMemberRoleController::class, 'syncClubMemberRole'])->middleware('perm.club:club_member,update');
    });
});
