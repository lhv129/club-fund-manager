<?php

namespace App\Domains\WebhookConfig\Requests;

use App\Base\BaseRequest;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use Illuminate\Validation\Rule;

class UpdateWebhookConfigRequest extends BaseRequest
{
    public function rules(): array
    {
        $clubId = $this->resolveClubId();

        return [
            'club_slug' => ['nullable', 'string', 'exists:club_translations,slug'],
            'bank_account_id' => [
                'sometimes',
                'required',
                Rule::exists('bank_accounts', 'id')
                    ->where(fn($query) => $query->where('club_id', $clubId)),
            ],
            'type'            => ['sometimes', 'required', 'string', 'in:casso,sepay'],
            'webhook_secret'  => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }

    private function resolveClubId(): ?int
    {
        $clubId = $this->attributes->get('club_id');

        if ($clubId !== null) {
            return (int) $clubId;
        }

        $webhookConfigId = $this->route('id');

        if (filter_var($webhookConfigId, FILTER_VALIDATE_INT) === false) {
            return null;
        }

        return WebhookConfig::query()
            ->whereKey((int) $webhookConfigId)
            ->value('club_id');
    }

    public function attributes(): array
    {
        return [
            'bank_account_id' => __('domains/webhook_config.attributes.bank_account_id'),
            'type'            => __('domains/webhook_config.attributes.type'),
            'webhook_secret'  => __('domains/webhook_config.attributes.webhook_secret'),
            'webhook_url'     => __('domains/webhook_config.attributes.webhook_url'),
            'is_verified'     => __('domains/webhook_config.attributes.is_verified'),
        ];
    }
}
