<?php

return [
    'attributes' => [
        'monthly_contribution_id' => 'Khoản đóng quỹ',
        'payment_code'            => 'Mã thanh toán',
        'status'                  => 'Trạng thái',
        'expired_at'              => 'Hết hạn lúc',
        'used_at'                 => 'Sử dụng lúc',
        'is_active'               => 'Trạng thái hoạt động',
        'sort_order'             => 'Thứ tự',
    ],

    'list'                  => 'Lấy danh sách mã thanh toán thành công.',
    'detail'                => 'Lấy chi tiết mã thanh toán thành công.',
    'generated'             => 'Lấy mã thanh toán thành công.',
    'no_active_code'        => 'Không có mã thanh toán đang active cho khoản đóng quỹ này.',
    'not_found'             => 'Không tìm thấy mã thanh toán.',
    'contribution_not_found' => 'Không tìm thấy khoản đóng quỹ.',
    'forbidden' => 'Bạn không có quyền lấy mã thanh toán',
    'already_paid' => 'Bạn đã thanh toán tháng này rồi',
];
