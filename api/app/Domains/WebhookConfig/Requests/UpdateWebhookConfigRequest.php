<?php

namespace App\Domains\WebhookConfig\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateWebhookConfigRequest extends BaseRequest
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
            'type'            => ['sometimes', 'required', 'string', 'in:casso,sepay'],
            'webhook_secret'  => ['sometimes', 'nullable', 'string', 'max:500'],
            'webhook_url'     => ['sometimes', 'nullable', 'url', 'max:500'],
            'is_active'       => ['sometimes', 'boolean'],
            'is_verified'     => ['sometimes', 'boolean'],
            'sort_order'      => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'bank_account_id' => __('domains/webhook_config.attributes.bank_account_id'),
            'type'            => __('domains/webhook_config.attributes.type'),
            'webhook_secret'  => __('domains/webhook_config.attributes.webhook_secret'),
            'webhook_url'     => __('domains/webhook_config.attributes.webhook_url'),
            'is_active'       => __('domains/webhook_config.attributes.is_active'),
            'is_verified'     => __('domains/webhook_config.attributes.is_verified'),
            'sort_order'      => __('domains/webhook_config.attributes.sort_order'),
        ];
    }
}
