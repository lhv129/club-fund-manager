<?php

return [
    'list' => 'Danh sách thông báo.',
    'unread_count' => 'Số thông báo chưa đọc.',
    'marked_read' => 'Đã đánh dấu thông báo đã đọc.',
    'marked_all_read' => 'Đã đánh dấu tất cả thông báo đã đọc.',
    'deleted' => 'Đã xóa thông báo.',
    'not_found' => 'Không tìm thấy thông báo.',

    'types' => [

        'fund_due' => [
            'title' => 'Nhắc đóng quỹ',
            'body' => 'Bạn cần đóng quỹ tháng :month/:year cho :club_name.',
        ],

        'monthly_contribution_created' => [
            'title' => 'Khoản đóng quỹ mới',
            'body' => ':club_name đã tạo khoản đóng quỹ tháng :month/:year cho bạn.',
        ],

        'monthly_contribution_updated' => [
            'title' => 'Khoản đóng quỹ được cập nhật',
            'body' => 'Khoản đóng quỹ tháng :month/:year của bạn tại :club_name đã được cập nhật sang trạng thái :status.',
        ],

        'monthly_contribution_cancelled' => [
            'title' => 'Khoản đóng quỹ đã bị hủy',
            'body' => 'Khoản đóng quỹ tháng :month/:year của bạn tại :club_name đã bị hủy.',
        ],

        'monthly_contribution_deleted' => [
            'title' => 'Khoản đóng quỹ đã bị xóa',
            'body' => 'Khoản đóng quỹ tháng :month/:year của bạn tại :club_name đã được xóa.',
        ],

        'transaction_confirmed' => [
            'title' => 'Thanh toán quỹ thành công',
            'body' => 'Khoản đóng quỹ tháng :month/:year của bạn tại :club_name đã được xác nhận qua chuyển khoản.',
        ],

        'cash_payment_confirmed' => [
            'title' => 'Đã xác nhận thanh toán tiền mặt',
            'body' => 'Khoản đóng quỹ tháng :month/:year của bạn tại :club_name đã được ghi nhận thanh toán bằng tiền mặt.',
        ],

        'club_transaction_received' => [
            'title' => 'Khoản thu mới',
            'body' => ':member_name đã đóng quỹ tháng :month/:year cho :club_name.',
        ],

        'club_expense_created' => [
            'title' => 'Khoản chi mới',
            'body' => ':club_name đã ghi nhận một khoản chi.',
        ],
    ],
];
