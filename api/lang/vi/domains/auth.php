<?php

/**
 * AUTH DOMAIN LANGUAGE FILE
 * ------------------------------------------
 * Chỉ dùng cho module Auth:
 * login, register, logout, reset password
 *
 * Cách dùng:
 * __('domains/auth.login_success')
 */

return [

    'attributes' => ['first_name' => 'Tên', 'last_name' => 'Họ', 'username' => 'Tên đăng nhập', 'gender' => 'Giới tính', 'email' => 'Email', 'password' => 'Mật khẩu', 'phone' => 'Số điện thoại', 'date_of_birth' => 'Ngày sinh', 'avatar' => 'Ảnh đại diện', 'address' => 'Địa chỉ',],

    'login_success' => 'Đăng nhập thành công',

    'user_not_found' => 'Email hoặc tên đăng nhập không tồn tại',

    'wrong_password' => 'Mật khẩu không chính xác',

    'account_not_verified' => 'Vui lòng xác thực email trước khi đăng nhập',

    'account_locked' => 'Tài khoản đã bị khóa',

    'logout_success' => 'Đăng xuất thành công',

    'get_profile' => 'Lấy thông tin cá nhân thành công',

    'refresh_token' => 'Làm mới token thành công',

    'refresh_token_invalid' => 'Refresh token không hợp lệ',

    'refresh_token_expired' => 'Refresh token đã hết hạn',

    'register_success' => 'Đăng ký thành công! Vui lòng kiểm tra email :email để kích hoạt tài khoản.',

    'update_profile' => 'Cập nhật thông tin cá nhân thành công',
];
