<?php

/**
 * VALIDATION LANGUAGE FILE
 * ------------------------------------------
 * Dùng cho toàn bộ Laravel validation system
 *
 * KHÔNG viết messages trong FormRequest nữa
 * Laravel sẽ tự lấy từ đây
 *
 * Cách dùng:
 * tự động khi validate hoặc __('validation.required')
 */

return [

    'required' => ':attribute không được để trống.',
    'string'   => ':attribute phải là chuỗi.',
    'email'    => ':attribute không đúng định dạng.',
    'unique'   => ':attribute đã tồn tại.',
    'integer'  => ':attribute phải là số nguyên.',
    'in'       => ':attribute không hợp lệ.',

    'min' => [
        'string' => ':attribute phải tối thiểu :min ký tự.',
        'numeric' => ':attribute phải ≥ :min.',
        'file' => ':attribute quá nhỏ (min :min KB).',
    ],

    'max' => [
        'string' => ':attribute tối đa :max ký tự.',
        'file' => ':attribute vượt quá :max KB.',
    ],

    'same'  => ':attribute không khớp.',
    'image' => ':attribute phải là file ảnh.',
    'mimes' => ':attribute chỉ chấp nhận :values.',

    'attributes' => [

        'first_name' => 'Tên',
        'last_name'  => 'Họ',
        'username'   => 'Tên đăng nhập',
        'email'      => 'Email',
        'password'   => 'Mật khẩu',
        'confirm_password' => 'Xác nhận mật khẩu',

        'avatar'  => 'Ảnh đại diện',
        'bgImage' => 'Ảnh nền',

        'count' => 'Số lượng',
        'description' => 'Mô tả',
    ],

    'values' => [
        'gender' => [
            'male'   => 'Nam',
            'female' => 'Nữ',
            'other'  => 'Khác',
        ],
    ],

    'required_locales' => 'Thiếu bản dịch cho các ngôn ngữ: :locales.',
    'translation_name_taken' => 'Tên này đã tồn tại cho ngôn ngữ :locale, vui lòng dùng tên khác.',
];
