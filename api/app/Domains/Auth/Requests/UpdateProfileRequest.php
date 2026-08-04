<?php


namespace App\Domains\Auth\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'first_name' => 'required|string|max:255',

            'last_name' => 'required|string|max:255',

            'username' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('users', 'username')->ignore($user->id),
            ],

            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'gender' => 'nullable|in:male,female,other',

            'phone' => [
                'nullable',
                'regex:/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/',
                Rule::unique('users', 'phone')->ignore($user->id),
            ],

            'date_of_birth' => [
                'nullable',
                'date',
                'date_format:Y-m-d',
                'before_or_equal:' . now()->subYears(8)->toDateString(),
                'after_or_equal:' . now()->subYears(80)->toDateString(),
            ],

            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

            'address' => 'nullable|string|max:150'
        ];
    }
}
