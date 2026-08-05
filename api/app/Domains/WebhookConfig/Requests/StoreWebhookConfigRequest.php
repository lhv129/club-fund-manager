<?php

namespace App\Domains\WebhookConfig\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class StoreWebhookConfigRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'bank_account_id' => [
                'required',
                Rule::exists('bank_accounts', 'id')
                    ->where(fn($q) => $q->where(
                        'club_id',
                        $this->attributes->get('club_id')
                    )),
            ],
            'type'            => ['required', 'string', 'in:casso,sepay'],
            'webhook_secret'  => ['nullable', 'string', 'max:500'],
            'webhook_url'     => ['nullable', 'url', 'max:500'],
            'is_active'       => ['nullable', 'boolean'],
            'sort_order'      => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Attribute label theo domain — hiển thị đúng label tiếng Việt/Anh khi validate fail.
     */
    public function attributes(): array
    {
        return [
            'bank_account_id' => __('domains/webhook_config.attributes.bank_account_id'),
            'type'            => __('domains/webhook_config.attributes.type'),
            'webhook_secret'  => __('domains/webhook_config.attributes.webhook_secret'),
            'webhook_url'     => __('domains/webhook_config.attributes.webhook_url'),
            'is_active'       => __('domains/webhook_config.attributes.is_active'),
            'sort_order'      => __('domains/webhook_config.attributes.sort_order'),
        ];
    }
}
