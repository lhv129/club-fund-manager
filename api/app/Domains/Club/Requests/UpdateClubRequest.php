<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\UniqueTranslation;
use Illuminate\Validation\Rule;

class UpdateClubRequest extends BaseRequest
{
    public function rules(): array
    {
        $clubId = (int) $this->route('id');

        return [
            'logo'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'max_members' => ['nullable', 'integer', 'min:1'],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
                new UniqueTranslation(
                    translationTable: 'club_translations',
                    excludeParentId: $clubId,
                    fkColumn: 'club_id',
                ),
            ],
            'translations.*.locale'      => ['required_with:translations', 'string', 'max:10', Rule::in(config('app.supported_locales'))],
            'translations.*.name'        => ['required_with:translations', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
        ];
    }
}
