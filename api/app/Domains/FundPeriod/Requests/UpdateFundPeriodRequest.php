<?php

namespace App\Domains\FundPeriod\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;

class UpdateFundPeriodRequest extends BaseRequest
{
    public function rules(): array
    {
        $id = (int) $this->route('id');

        return [
            'club_id'          => ['sometimes', 'required', 'integer', 'exists:clubs,id'],
            'year'              => ['sometimes', 'required', 'integer', 'min:2000', 'max:2100'],
            'month'             => ['sometimes', 'required', 'integer', 'min:1', 'max:12'],
            'male_amount'       => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'female_amount'     => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'exchange_male_amount'   => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'exchange_female_amount'   => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'is_locked'         => ['sometimes', 'boolean'],
            'is_active'          => ['sometimes', 'boolean'],
            'sort_order'         => ['sometimes', 'integer', 'min:0'],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
                new SupportedLocalesOnly,
                new UniqueTranslation(
                    translationTable: 'fund_period_translations',
                    nameField: 'title',
                    excludeParentId: $id,
                    fkColumn: 'fund_period_id',
                ),
            ],
            'translations.*'             => ['array'],
            'translations.*.title'        => ['required', 'string', 'max:255'],
            'translations.*.description'  => ['nullable', 'string', 'max:3000'],
        ];
    }

    public function attributes(): array
    {
        return array_merge(
            [
                'club_id'          => __('domains/fund_period.attributes.club_id'),
                'year'              => __('domains/fund_period.attributes.year'),
                'month'             => __('domains/fund_period.attributes.month'),
                'male_amount'       => __('domains/fund_period.attributes.male_amount'),
                'female_amount'     => __('domains/fund_period.attributes.female_amount'),
                'exchange_male_amount' => __('domains/fund_period.attributes.exchange_male_amount'),
                'exchange_female_amount' => __('domains/fund_period.attributes.exchange_female_amount'),
                'is_locked'         => __('domains/fund_period.attributes.is_locked'),
                'is_active'          => __('domains/fund_period.attributes.is_active'),
                'sort_order'         => __('domains/fund_period.attributes.sort_order'),
            ],
            $this->translationAttributes('fund_period', ['title', 'description']),
        );
    }
}
