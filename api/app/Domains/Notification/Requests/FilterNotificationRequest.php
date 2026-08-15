<?php

namespace App\Domains\Notification\Requests;

use App\Base\BaseRequest;

class FilterNotificationRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'is_read' => ['sometimes', 'nullable', 'boolean'],
            'type' => ['sometimes', 'nullable', 'string', 'max:100'],
            'club_id' => ['sometimes', 'nullable', 'integer', 'exists:clubs,id'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'sort_by' => ['sometimes', 'in:id,created_at,read_at'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
        ];
    }
}
