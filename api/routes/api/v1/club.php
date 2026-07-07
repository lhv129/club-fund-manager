<?php
use App\Domains\Club\Controllers\ClubController;
use Illuminate\Support\Facades\Route;

Route::prefix('clubs')->group(function () {
    // Superadmin thấy tất cả, Manager thấy clubs mình thuộc về
    Route::get('/', [ClubController::class, 'index'])
        ->middleware('permission:club,view');
    // Các route cần club context -> có {clubId} trong path
    // Route::get('/{clubId}/members', [...])
    //     ->middleware('permission:member,view');
});
