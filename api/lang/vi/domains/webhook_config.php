<?php

/**
 * WEBHOOK CONFIG DOMAIN LANGUAGE FILE lang/vi/domains/webhook_config.php
 */

return [
    'attributes' => [
        'type'            => 'Loại nhà cung cấp',
        'webhook_secret' => 'Webhook secret',
        'webhook_url'    => 'URL webhook',
        'is_verified'    => 'Trạng thái xác minh',
        'bank_account_id' => 'Tài khoản ngân hàng',
    ],

    'list'           => 'Lấy danh sách cấu hình webhook thành công.',
    'detail'         => 'Lấy chi tiết cấu hình webhook thành công.',
    'select'         => 'Lấy danh sách cấu hình webhook (dropdown) thành công.',
    'created'        => 'Tạo cấu hình webhook thành công.',
    'updated'        => 'Cập nhật cấu hình webhook thành công.',
    'deleted'        => 'Xoá cấu hình webhook thành công.',
    'not_found'      => 'Không tìm thấy cấu hình webhook.',
    'duplicate_bank_account_type' => 'Tài khoản ngân hàng này đã có cấu hình webhook trong câu lạc bộ hiện tại.',
];
