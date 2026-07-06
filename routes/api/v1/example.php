<?php

use App\Domains\Example\Controllers\ExampleController;
use Illuminate\Support\Facades\Route;

Route::prefix('examples')->group(function () {

    // Danh sách + filter + search + sort + phân trang
    Route::get('/',[ExampleController::class, 'index']);

    // Dropdown — lấy danh sách active
    Route::get('/active',[ExampleController::class, 'active']);

    // Reorder — kéo thả sort_order
    Route::post('/reorder',[ExampleController::class, 'reorder']);

    // Chi tiết
    Route::get('/{id}',[ExampleController::class, 'show']);

    // Tạo mới
    Route::post('/',[ExampleController::class, 'store']);

    // Cập nhật
    Route::put('/{id}',[ExampleController::class, 'update']);

    // Xoá
    Route::delete('/{id}',[ExampleController::class, 'destroy']);

    // Bật/tắt trạng thái
    Route::patch('/{id}/toggle-status', [ExampleController::class, 'toggleStatus']);
});
