<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class UpdateExchangeSessionPlayerRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id'        => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'player_name'    => ['sometimes', 'nullable', 'array'],
            'player_name.*'  => ['sometimes', 'string', 'max:255'],
            'male'           => ['sometimes', 'integer', 'min:0'],
            'female'         => ['sometimes', 'integer', 'min:0'],
            'transaction_id' => ['sometimes', 'nullable', 'integer', 'exists:transactions,id'],
            'amount'         => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'paid'           => ['sometimes', 'boolean'],
            'checked_in'     => ['sometimes', 'boolean'],
            'is_active'      => ['sometimes', 'boolean'],
            'sort_order'     => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Khi cả 2 đều được gửi và đều rỗng → báo lỗi
            if ($this->has('user_id') && $this->has('player_name')
                && empty($this->input('user_id'))
                && empty($this->input('player_name'))) {
                $validator->errors()->add(
                    'player_name',
                    __('domains/exchange_session.player_identifier_required')
                );
            }

            // Khi cả male + female đều được gửi và tổng = 0 → báo lỗi
            if ($this->has('male') && $this->has('female')
                && ((int) $this->input('male') + (int) $this->input('female')) === 0) {
                $validator->errors()->add(
                    'male',
                    __('domains/exchange_session.player_count_required')
                );
            }
        });
    }

    public function attributes(): array
    {
        return [
            'user_id'        => __('domains/exchange_session.attributes.player_user_id'),
            'player_name'    => __('domains/exchange_session.attributes.player_name'),
            'male'           => __('domains/exchange_session.attributes.player_male'),
            'female'         => __('domains/exchange_session.attributes.player_female'),
            'transaction_id' => __('domains/exchange_session.attributes.player_transaction_id'),
            'amount'         => __('domains/exchange_session.attributes.player_amount'),
            'paid'           => __('domains/exchange_session.attributes.player_paid'),
            'checked_in'     => __('domains/exchange_session.attributes.player_checked_in'),
        ];
    }
}
