<?php

namespace App\Domains\Transaction\Requests;

use App\Base\BaseRequest;

/**
 * Cập nhật Transaction — CHỈ cho phép sửa `description` (mô tả/lý do).
 *
 * Dùng cho expense do webhook tạo: admin thêm lý do chi
 * (vd. "tiền sân buổi 4/8"). Không cho sửa amount/date/type/source.
 */
class UpdateTransactionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'description' => __('domains/transaction.attributes.description'),
        ];
    }
}
