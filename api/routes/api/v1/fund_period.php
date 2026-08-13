<?php

use App\Domains\FundPeriod\Controllers\FundPeriodController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('fund-periods')->group(function () {

        // ============================================================
        // STATIC ROUTES
        // Phải đặt trước /{id}
        // ============================================================

        // Cursor pagination
        Route::get(
            '/cursor',
            [FundPeriodController::class, 'cursorIndex']
        )->middleware('perm.club:fund_period,view');

        // Dropdown
        Route::get(
            '/select',
            [FundPeriodController::class, 'select']
        )->middleware('perm.club:fund_period,view');


        // ============================================================
        // LIST
        // ============================================================

        Route::get(
            '/',
            [FundPeriodController::class, 'index']
        )->middleware('perm.club:fund_period,view');


        // ============================================================
        // CREATE
        // ============================================================

        Route::post(
            '/',
            [FundPeriodController::class, 'store']
        )->middleware('perm.club:fund_period,create');


        // ============================================================
        // RESTORE
        //
        // Static route phải nằm trước /{id}
        // ============================================================

        Route::post('/{id}/restore',[FundPeriodController::class, 'restore'])->middleware('perm.club:fund_period,update');


        // ============================================================
        // CLOSE
        //
        // Đóng kỳ quỹ:
        // OPEN -> LOCKED
        // ============================================================

        Route::post(
            '/{id}/close',
            [FundPeriodController::class, 'close']
        )->middleware('perm.club:fund_period,update');


        // ============================================================
        // REOPEN
        //
        // Mở lại kỳ đã khóa:
        // LOCKED -> OPEN
        // ============================================================

        Route::post(
            '/{id}/reopen',
            [FundPeriodController::class, 'reopen']
        )->middleware('perm.club:fund_period,update');


        // ============================================================
        // DETAIL
        // ============================================================

        Route::get(
            '/{id}',
            [FundPeriodController::class, 'show']
        )->middleware('perm.club:fund_period,view');


        // ============================================================
        // UPDATE
        // ============================================================

        Route::put(
            '/{id}',
            [FundPeriodController::class, 'update']
        )->middleware('perm.club:fund_period,update');


        // ============================================================
        // DELETE
        //
        // Soft delete.
        // Service sẽ chặn nếu FundPeriod đã locked.
        // ============================================================

        Route::delete(
            '/{id}',
            [FundPeriodController::class, 'destroy']
        )->middleware('perm.club:fund_period,delete');


        // ============================================================
        // TOGGLE ACTIVE STATUS
        //
        // is_active != is_locked
        // Service sẽ chặn nếu FundPeriod đã locked.
        // ============================================================

        Route::post(
            '/{id}/toggle-status',
            [FundPeriodController::class, 'toggleStatus']
        )->middleware('perm.club:fund_period,update');
    });
});



// | Method   | Endpoint                           | Ý nghĩa             |
// | -------- | ---------------------------------- | ------------------- |
// | `GET`    | `/fund-periods`                    | Danh sách           |
// | `GET`    | `/fund-periods/cursor`             | Cursor pagination   |
// | `GET`    | `/fund-periods/select`             | Dropdown            |
// | `POST`   | `/fund-periods`                    | Tạo kỳ              |
// | `GET`    | `/fund-periods/{id}`               | Chi tiết            |
// | `PUT`    | `/fund-periods/{id}`               | Sửa kỳ              |
// | `DELETE` | `/fund-periods/{id}`               | Soft delete         |
// | `POST`   | `/fund-periods/{id}/restore`       | Khôi phục           |
// | `POST`   | `/fund-periods/{id}/close`         | Đóng/lock kỳ        |
// | `POST`   | `/fund-periods/{id}/reopen`        | Mở lại kỳ đã lock   |
// | `POST`   | `/fund-periods/{id}/toggle-status` | Bật/tắt `is_active` |
