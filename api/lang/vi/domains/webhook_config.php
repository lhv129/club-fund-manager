<?php

/**
 * WEBHOOK CONFIG DOMAIN LANGUAGE FILE
 */

return [
    'attributes' => [
        'type'            => 'loại nhà cung cấp',
        'api_key'         => 'API key',
        'webhook_secret' => 'webhook secret',
        'webhook_url'    => 'URL webhook',
        'is_verified'    => 'trạng thái xác minh',
        'is_active'      => 'trạng thái hoạt động',
        'sort_order'     => 'thứ tự sắp xếp',
        'bank_account_id' => 'tài khoản ngân hàng',
    ],

    'list'           => 'Lấy danh sách cấu hình webhook thành công.',
    'detail'         => 'Lấy chi tiết cấu hình webhook thành công.',
    'select'         => 'Lấy danh sách cấu hình webhook (dropdown) thành công.',
    'created'        => 'Tạo cấu hình webhook thành công.',
    'updated'        => 'Cập nhật cấu hình webhook thành công.',
    'deleted'        => 'Xoá cấu hình webhook thành công.',
    'status_toggled' => 'Cập nhật trạng thái cấu hình webhook thành công.',
    'reordered'      => 'Cập nhật thứ tự cấu hình webhook thành công.',
    'not_found'      => 'Không tìm thấy cấu hình webhook.',
];
