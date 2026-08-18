<?php

use Illuminate\Support\Facades\Route;


// V1 — vẫn chạy bình thường
Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/v1/auth.php';
    require __DIR__ . '/api/v1/user.php';
    require __DIR__ . '/api/v1/webhook.php';
    require __DIR__ . '/api/v1/club.php';
    require __DIR__ . '/api/v1/club_invite.php';
    require __DIR__ . '/api/v1/club_member.php';
    require __DIR__ . '/api/v1/club_member_role.php';
    require __DIR__ . '/api/v1/module.php';
    require __DIR__ . '/api/v1/role.php';
    require __DIR__ . '/api/v1/bank_account.php';
    require __DIR__ . '/api/v1/webhook_config.php';
    require __DIR__ . '/api/v1/fund_period.php';
    require __DIR__ . '/api/v1/playing_schedule.php';
    require __DIR__ . '/api/v1/exchange_session.php';
    require __DIR__ . '/api/v1/member_payment_code.php';
    require __DIR__ . '/api/v1/transaction.php';
    require __DIR__ . '/api/v1/monthly_contribution.php';
    require __DIR__ . '/api/v1/bank.php';
    require __DIR__ . '/api/v1/example.php';
    require __DIR__ . '/api/v1/notification.php';
    require __DIR__ . '/api/v1/dashboard.php';
});


// V2 — thêm mới, chạy song song với V1
// Route::prefix('v2')->group(function () {
//     require __DIR__ . '/api/v2/user.php';
// });
