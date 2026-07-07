<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * -------------------------------------------------------------
 *  Base Laravel API
 *  Author : vietlh
 *  Email  : vietlh.hn@gmail.com
 *  Created: 2026
 *  License: Private / MIT
 * -------------------------------------------------------------
 */

class ApiException extends RuntimeException
{
    protected int    $status;
    protected string $errorCode;
    protected mixed  $data;

    /**
     * @param string $message   Thông báo lỗi hiển thị
     * @param int    $status    HTTP status code (400, 403, 404, 422, 500,...)
     * @param string $errorCode Mã lỗi nội bộ — dùng cho frontend xử lý logic
     *                          VD: 'USER_NOT_FOUND', 'INSUFFICIENT_BALANCE'
     * @param mixed  $data      Data bổ sung kèm theo lỗi (optional)
     */
    public function __construct(
        string $message   = 'Có lỗi xảy ra',
        int    $status    = 400,
        string $errorCode = '',
        mixed  $data      = null
    ) {
        parent::__construct($message, $status);

        $this->status    = $status;
        $this->errorCode = $errorCode ?: $this->defaultErrorCode($status);
        $this->data      = $data;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getData(): mixed
    {
        return $this->data;
    }

    /**
     * Sinh errorCode mặc định từ HTTP status nếu không truyền
     */
    private function defaultErrorCode(int $status): string
    {
        return match ($status) {
            400 => 'BAD_REQUEST',
            401 => 'UNAUTHORIZED',
            403 => 'FORBIDDEN',
            404 => 'NOT_FOUND',
            422 => 'VALIDATION_ERROR',
            429 => 'TOO_MANY_REQUESTS',
            500 => 'SERVER_ERROR',
            default => 'ERROR',
        };
    }
}


// Đơn giản nhất — chỉ cần message + status
// throw new ApiException('Người dùng không tồn tại', 404);
// → errorCode tự sinh = 'NOT_FOUND'

// Có errorCode riêng — để frontend xử lý logic
// throw new ApiException('Tài khoản đã bị khoá', 403, 'ACCOUNT_LOCKED');

// Có data kèm theo
// throw new ApiException('Validation thủ công', 422, 'VALIDATION_ERROR', [
//     'field' => 'email',
//     'hint'  => 'Vui lòng dùng email công ty',
// ]);
