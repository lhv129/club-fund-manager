<?php

namespace App\Base;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * -------------------------------------------------------------
 *  Base Laravel API
 *  Author : vietlh
 *  Email  : vietlh.hn@gmail.com
 *  Created: 2026
 *  License: Private / MIT
 * -------------------------------------------------------------
 */

abstract class BaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(Validator $validator)
    {
        if ($this->expectsJson()) {
            throw new HttpResponseException(
                response()->json([
                    'success' => false,
                    'message' => __('exception.validation_failed'),
                    'errors' => $validator->errors()
                ], 422)
            );
        }

        // CMS (Blade) → redirect back
        throw new HttpResponseException(
            redirect()->back()
                ->withErrors($validator)
                ->withInput()
        );
    }

    protected function failedAuthorization()
    {
        throw new HttpResponseException(

            response()->json([
                'success' => false,
                'message' => __('exception.forbidden')
            ], 403)

        );
    }

    /**
     * Build wildcard attribute map cho các field translations.*.{field}
     * dựa theo lang key riêng của từng domain, ví dụ:
     *   lang/vi/club.php => ['attributes' => ['name' => 'tên câu lạc bộ']]
     *   lang/en/club.php => ['attributes' => ['name' => 'club name']]
     */
    protected function translationAttributes(string $langGroup, array $fields): array
    {
        $attrs = [];
        foreach ($fields as $field) {
            $attrs["translations.*.$field"] = __("domains/$langGroup.attributes.$field");
        }
        return $attrs;
    }
}
