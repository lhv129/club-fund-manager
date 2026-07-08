<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use App\Base\Rules\UniqueTranslation;
use Illuminate\Validation\Rule;

class StoreClubRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'logo'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active'  => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'max_members' => ['nullable', 'integer', 'min:1'],

            'translations' => [
                'required',
                'array',
                new RequiredLocales,
                new UniqueTranslation('club_translations'),
            ],
            'translations.*.locale'      => ['required', 'string', 'max:10', Rule::in(config('app.supported_locales'))],
            'translations.*.name'        => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
        ];
    }
}
