<?php

namespace App\Domains\WebhookConfig\Requests;

use App\Base\BaseRequest;

class FilterWebhookConfigRequest extends BaseRequest
{
    /**
     * Whitelist sort_by chống cột lạ xuống Query Builder (mục 13 api-overview.md).
     */
    public function rules(): array
    {
        return [
            'search'       => ['nullable', 'string', 'max:255'],
            'type'         => ['nullable', 'string', 'in:casso,sepay'],
            'is_verified'  => ['nullable', 'boolean'],
            'bank_account_id' => ['nullable', 'integer', 'min:1'],
            'limit'        => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'         => ['nullable', 'integer', 'min:1'],
            'sort_by'      => ['nullable', 'string', 'in:id,type,created_at'],
            'sort_dir'     => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'type'            => __('domains/webhook_config.attributes.type'),
            'is_verified'     => __('domains/webhook_config.attributes.is_verified'),
            'bank_account_id' => __('domains/webhook_config.attributes.bank_account_id'),
        ];
    }
}
