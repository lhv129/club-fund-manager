<?php

use App\Domains\Example\Controllers\ExampleController;
use Illuminate\Support\Facades\Route;

// Example là module reference/demo — chỉ cần đăng nhập, không check perm.system
Route::middleware('auth.jwt')->prefix('examples')->group(function () {

    // Tĩnh trước — bắt buộc đứng trước /{id}
    Route::get('/cursor',       [ExampleController::class, 'cursorIndex'])->middleware('perm.club:example,view');
    Route::get('/select',       [ExampleController::class, 'select'])->middleware('perm.club:example,view');
    Route::get('/slug/{slug}',  [ExampleController::class, 'showBySlug'])->middleware('perm.club:example,view');
    Route::post('/reorder',     [ExampleController::class, 'reorder'])->middleware('perm.club:example,update');
    Route::post('/{id}/restore', [ExampleController::class, 'restore'])->middleware('perm.club:example,update');
    Route::delete('/{id}/force', [ExampleController::class, 'forceDestroy'])->middleware('perm.club:example,delete');

    // Dynamic sau
    Route::get('/', [ExampleController::class, 'index'])->middleware('perm.club:example,view');
    Route::get('/{id}', [ExampleController::class, 'show'])->middleware('perm.club:example,view');
    Route::post('/', [ExampleController::class, 'store'])->middleware('perm.club:example,create');
    Route::put('/{id}', [ExampleController::class, 'update'])->middleware('perm.club:example,update');
    Route::delete('/{id}', [ExampleController::class, 'destroy'])->middleware('perm.club:example,delete');
    Route::patch('/{id}/toggle-status', [ExampleController::class, 'toggleStatus'])->middleware('perm.club:example,update');
});
