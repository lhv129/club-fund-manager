<?php

namespace App\Domains\WebhookConfig\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class StoreWebhookConfigRequest extends BaseRequest
{
    public function rules(): array
    {
        $clubId = $this->attributes->get('club_id');

        return [
            'club_slug' => ['required', 'string', 'exists:club_translations,slug'],
            'bank_account_id' => [
                'required',
                Rule::exists('bank_accounts', 'id')
                    ->where(fn($query) => $query->where('club_id', $clubId)),
            ],
            'type' => ['required', 'string', 'in:casso,sepay'],
            'webhook_secret'  => ['nullable', 'string', 'max:500']
        ];
    }

    /**
     * Attribute label theo domain — hiển thị đúng label tiếng Việt/Anh khi validate fail.
     */
    public function attributes(): array
    {
        return [
            'club_id'         => __('domains/webhook_config.attributes.club_id'),
            'bank_account_id' => __('domains/webhook_config.attributes.bank_account_id'),
            'type'            => __('domains/webhook_config.attributes.type'),
            'webhook_secret'  => __('domains/webhook_config.attributes.webhook_secret'),
            'webhook_url'     => __('domains/webhook_config.attributes.webhook_url'),
        ];
    }
}
