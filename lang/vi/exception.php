<?php

/**
 * EXCEPTION LANGUAGE FILE
 * ------------------------------------------
 * Dùng cho toàn bộ API errors
 * BaseRequest + Handler + ApiException
 *
 * Cách dùng:
 * __('exception.validation_failed')
 */

return [

    // app/Base/BaseRequest.php
    'validation_failed' => 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại.',
    'unauthorized'      => 'Bạn chưa đăng nhập.',
    'forbidden'         => 'Bạn không có quyền truy cập.',
    'not_found'         => 'Không tìm thấy dữ liệu.',
    'server_error'      => 'Lỗi hệ thống, vui lòng thử lại sau.',

    // app/Middleware/JwtAuthenticate.php
    'token_not_provided'       => 'Vui lòng cung cấp access token trong header Authorization.',
    'token_expired'            => 'Access token đã hết hạn.',
    'token_blacklisted'        => 'Access token đã bị vô hiệu hóa, vui lòng đăng nhập lại.',
    'token_invalid'            => 'Access token không hợp lệ.',
    'token_invalid_signature'  => 'Chữ ký token không hợp lệ.',

    // app/bootstrap/app.php
    'server_error' => 'Lỗi hệ thống, vui lòng thử lại sau.',

    // app/Base/BaseService.php
    'not_found' => 'Không tìm thấy dữ liệu.',
];
