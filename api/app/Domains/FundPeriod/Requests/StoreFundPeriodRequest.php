<?php

namespace App\Domains\FundPeriod\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;

class StoreFundPeriodRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'club_id'          => ['required', 'integer', 'exists:clubs,id'],
            'year'              => ['required', 'integer', 'min:2000', 'max:2100'],
            'month'             => ['required', 'integer', 'min:1', 'max:12'],
            'male_amount'       => ['nullable', 'numeric', 'min:0'],
            'female_amount'     => ['nullable', 'numeric', 'min:0'],
            'exchange_amount'   => ['nullable', 'numeric', 'min:0'],
            'is_locked'         => ['nullable', 'boolean'],
            'is_active'          => ['nullable', 'boolean'],
            'sort_order'         => ['nullable', 'integer', 'min:0'],

            'translations' => [
                'required',
                'array',
                new RequiredLocales,
                new SupportedLocalesOnly,
                new UniqueTranslation('fund_period_translations', nameField: 'title'),
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
                'exchange_amount'   => __('domains/fund_period.attributes.exchange_amount'),
                'is_locked'         => __('domains/fund_period.attributes.is_locked'),
                'is_active'          => __('domains/fund_period.attributes.is_active'),
                'sort_order'         => __('domains/fund_period.attributes.sort_order'),
            ],
            $this->translationAttributes('fund_period', ['title', 'description']),
        );
    }
}
