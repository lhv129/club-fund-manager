<?php

use App\Domains\ClubMemberRole\Controllers\ClubMemberRoleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('/club-member-roles')->group(function () {
        Route::put('/sync', [ClubMemberRoleController::class, 'syncClubMemberRole'])->middleware('perm.club:club_member,update');

        
        Route::put('/syncUserRole', [ClubMemberRoleController::class, 'syncUserRole'])->middleware('perm.system:role,update');
        Route::delete('/user-role/{userId}',[ClubMemberRoleController::class, 'destroyUserRole'])->middleware('perm.system:role,update');
    });
});
