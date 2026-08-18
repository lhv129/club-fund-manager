<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class StoreExchangeSessionPlayerRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id'        => ['nullable', 'integer', 'exists:users,id'],
            // 'player_name'    => ['nullable', 'array'],
            'player_name'  => ['nullable','string', 'max:255'],
            'male'           => ['nullable', 'integer', 'min:0'],
            'female'         => ['nullable', 'integer', 'min:0'],
            'transaction_id' => ['nullable', 'integer', 'exists:transactions,id'],

            'amount'        => ['nullable', 'numeric', 'min:0'],
            'paid'          => ['nullable', 'boolean'],
            'is_active'      => ['nullable', 'boolean'],
            'sort_order'    => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $userId     = $this->input('user_id');
            $playerName = $this->input('player_name');

            // Phải có ít nhất 1 định danh: user_id (member) hoặc player_name (người lạ)
            if (empty($userId) && empty($playerName)) {
                $validator->errors()->add(
                    'player_name',
                    __('domains/exchange_session.player_identifier_required')
                );
            }

            // Phải có ít nhất 1 người trong nhóm
            $male   = (int) $this->input('male', 0);
            $female = (int) $this->input('female', 0);
            if ($male + $female === 0) {
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
        ];
    }
}
