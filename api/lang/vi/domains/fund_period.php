<?php

return [
    'attributes' => [
        'club_id'                 => 'Câu lạc bộ',
        'year'                    => 'Năm',
        'month'                   => 'Tháng',
        'male_amount'             => 'Số tiền nam',
        'female_amount'           => 'Số tiền nữ',
        'exchange_male_amount'    => 'Số tiền giao lưu nam',
        'exchange_female_amount'  => 'Số tiền giao lưu nữ',
        'is_locked'               => 'Trạng thái khóa',
        'is_active'               => 'Trạng thái hoạt động',
        'sort_order'              => 'Thứ tự',
        'title'                   => 'Tiêu đề',
        'description'             => 'Mô tả',
    ],

    // ============================================================
    // SUCCESS
    // ============================================================

    'list' => 'Lấy danh sách kỳ quỹ thành công.',

    'trashed' => 'Lấy danh sách kỳ quỹ đã bị xóa thành công',

    'detail' => 'Lấy chi tiết kỳ quỹ thành công.',

    'select' => 'Lấy danh sách kỳ quỹ (dropdown) thành công.',

    'created' => 'Tạo kỳ quỹ thành công.',

    'updated' => 'Cập nhật kỳ quỹ thành công.',

    'deleted' => 'Xóa kỳ quỹ thành công.',

    'restored' => 'Khôi phục kỳ quỹ thành công.',

    'closed' => 'Đóng kỳ quỹ thành công.',

    'reopened' => 'Mở lại kỳ quỹ thành công.',

    'reordered' => 'Cập nhật thứ tự kỳ quỹ thành công.',

    'status_activated' => 'Đã kích hoạt kỳ quỹ.',

    'status_deactivated' => 'Đã ngừng hoạt động kỳ quỹ.',


    // ============================================================
    // COMMON ERRORS
    // ============================================================

    'not_found' => 'Không tìm thấy kỳ quỹ.',

    'already_exists' => 'Kỳ quỹ của tháng và năm này đã tồn tại.',

    'deleted_period_exists' => 'Kỳ quỹ của tháng và năm này đã tồn tại nhưng đang ở trạng thái đã xóa. Vui lòng khôi phục kỳ quỹ đó thay vì tạo mới.',


    // ============================================================
    // DELETE / RESTORE
    // ============================================================

    'cannot_delete_locked' => 'Không thể xóa kỳ quỹ đã khóa.',

    'not_deleted' => 'Kỳ quỹ chưa được xóa.',

    'restore_conflict' => 'Không thể khôi phục kỳ quỹ vì đã tồn tại một kỳ quỹ khác cùng tháng và năm.',


    // ============================================================
    // LOCK / CLOSE
    // ============================================================

    'already_locked' => 'Kỳ quỹ đã được khóa.',

    'locked' => 'Kỳ quỹ đã khóa nên không thể thực hiện thao tác này.',

    'cannot_close' => 'Không thể đóng kỳ quỹ.',


    // ============================================================
    // REOPEN
    // ============================================================

    'not_locked' => 'Kỳ quỹ chưa được khóa.',

    'reopen_reason_required' => 'Vui lòng nhập lý do mở lại kỳ quỹ.',


    // ============================================================
    // CONTRIBUTION / BUSINESS RULE
    // ============================================================

    'has_unresolved_contributions' => 'Kỳ quỹ vẫn còn các khoản đóng góp chưa được xử lý.',

    'has_outstanding_contributions' => 'Kỳ quỹ vẫn còn các khoản chưa hoàn tất thanh toán.',

    'cannot_modify_locked' => 'Không thể thay đổi dữ liệu của kỳ quỹ đã khóa.',
];
