<?php

use Illuminate\Support\Facades\Route;


// V1 — vẫn chạy bình thường
Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/v1/auth.php'; 
    require __DIR__ . '/api/v1/user.php';
    require __DIR__ . '/api/v1/webhook.php'; 
    require __DIR__ . '/api/v1/club.php'; 
});


// V2 — thêm mới, chạy song song với V1
// Route::prefix('v2')->group(function () {
//     require __DIR__ . '/api/v2/user.php';
// });
