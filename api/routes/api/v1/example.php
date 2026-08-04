<?php

use App\Domains\Example\Controllers\ExampleController;
use Illuminate\Support\Facades\Route;

// Example là module reference/demo — chỉ cần đăng nhập, không check perm.system
Route::middleware('auth.jwt')->prefix('examples')->group(function () {

    // Tĩnh trước — bắt buộc đứng trước /{id}
    Route::get('/cursor',       [ExampleController::class, 'cursorIndex']);
    Route::get('/select',       [ExampleController::class, 'select']);
    Route::get('/slug/{slug}',  [ExampleController::class, 'showBySlug']);
    Route::post('/reorder',     [ExampleController::class, 'reorder']);

    // Dynamic sau
    Route::get('/',             [ExampleController::class, 'index']);
    Route::get('/{id}',         [ExampleController::class, 'show']);
    Route::post('/',            [ExampleController::class, 'store']);
    Route::put('/{id}',         [ExampleController::class, 'update']);
    Route::delete('/{id}',      [ExampleController::class, 'destroy']);
    Route::patch('/{id}/toggle-status', [ExampleController::class, 'toggleStatus']);
});
