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
            'title' => 'Nhắc đóng quỹ tháng :month/:year',
            'body' => 'Bạn cần đóng :amount cho :club_name.',
        ],
        'monthly_contribution_created' => [
            'title' => 'Thông báo đóng quỹ tháng :month/:year',
            'body' => 'CLB :club_name đã tạo khoản đóng quỹ :amount cho bạn.',
        ],
        'monthly_contribution_updated' => [
            'title' => 'Cập nhật đóng quỹ tháng :month/:year',
            'body' => 'Khoản đóng quỹ :amount của bạn tại CLB :club_name đã được cập nhật sang trạng thái :status.',
        ],
        'monthly_contribution_cancelled' => [
            'title' => 'Hủy đóng quỹ tháng :month/:year',
            'body' => 'Khoản đóng quỹ :amount của bạn tại CLB :club_name đã bị hủy.',
        ],
        'monthly_contribution_deleted' => [
            'title' => 'Xóa khoản đóng quỹ tháng :month/:year',
            'body' => 'Khoản đóng quỹ :amount của bạn tại CLB :club_name đã được xóa.',
        ],
    ],
];
