<?php

namespace App\Domains\Notification\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class MarkAllReadRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'ids' => ['nullable', 'array', 'min:1'],
            'ids.*' => [
                'nullable',
                'integer',
                'distinct',
                Rule::exists('notifications', 'id'),
            ],
        ];
    }
}
