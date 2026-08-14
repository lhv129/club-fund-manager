<?php

return [
    'list' => 'Danh sách khoản đóng quỹ tháng.',
    'select' => 'Danh sách khoản đóng quỹ tháng (dropdown).',
    'detail' => 'Chi tiết khoản đóng quỹ tháng.',
    'created' => 'Tạo khoản đóng quỹ tháng thành công.',
    'updated' => 'Cập nhật khoản đóng quỹ tháng thành công.',
    'deleted' => 'Xoá khoản đóng quỹ tháng thành công.',
    'not_found' => 'Không tìm thấy khoản đóng quỹ tháng.',
    'status_toggled' => 'Đã cập nhật trạng thái khoản đóng quỹ.',
    'invalid_gender' => 'Người dùng chưa chọn giới tính.',
    'already_exists' => 'Thành viên đã có khoản đóng góp cho kỳ này.',
    'cancelled_bank_exists' => 'Khoản đóng quỹ chuyển khoản đã bị huỷ vẫn còn giao dịch đối soát. Vui lòng cập nhật bản ghi hiện tại thay vì tạo mới.',
    'payment_method_required' => 'Vui lòng chọn hình thức thanh toán.',
    'transaction_required' => 'Khoản đóng quỹ đã thanh toán phải được gắn với một giao dịch.',
    'invalid_payment_transaction' => 'Giao dịch không hợp lệ với CLB hoặc hình thức thanh toán đã chọn.',
    'cash_transaction_description' => 'Thu tiền mặt khoản đóng quỹ tháng :month/:year - :fullname',

    'attributes' => [
        'club_id' => 'CLB',
        'user_id' => 'Thành viên',
        'period_id' => 'Kỳ quỹ',
        'transaction_id' => 'Giao dịch',
        'amount' => 'Số tiền',
        'status' => 'Trạng thái',
        'paid_by' => 'Hình thức thanh toán',
        'payment_date' => 'Ngày thanh toán',
        'is_active' => 'Kích hoạt',
    ],
];
