<?php

/**
 * VALIDATION LANGUAGE FILE
 * ------------------------------------------
 * Dùng cho toàn bộ Laravel validation system.
 *
 * KHÔNG viết messages trong FormRequest nữa.
 * Laravel sẽ tự lấy từ file này.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Basic Rules
    |--------------------------------------------------------------------------
    */

    'accepted' => ':attribute phải được chấp nhận.',
    'array' => ':attribute phải là một mảng.',
    'boolean' => ':attribute phải là true hoặc false.',
    'confirmed' => ':attribute xác nhận không khớp.',
    'date' => ':attribute không phải là ngày hợp lệ.',
    'date_format' => ':attribute phải có định dạng :format.',
    'different' => ':attribute và :other phải khác nhau.',
    'digits' => ':attribute phải gồm :digits chữ số.',
    'digits_between' => ':attribute phải gồm từ :min đến :max chữ số.',
    'email' => ':attribute không đúng định dạng email.',
    'exists' => ':attribute không tồn tại.',
    'file' => ':attribute phải là một tệp.',
    'image' => ':attribute phải là file ảnh.',
    'in' => ':attribute chỉ được phép là: :values.',
    'integer' => ':attribute phải là số nguyên.',
    'mimes' => ':attribute chỉ chấp nhận các định dạng: :values.',
    'nullable' => ':attribute có thể để trống.',
    'numeric' => ':attribute phải là số.',
    'regex' => ':attribute không đúng định dạng.',
    'required' => ':attribute không được để trống.',
    'same' => ':attribute và :other phải giống nhau.',
    'string' => ':attribute phải là chuỗi.',
    'unique' => ':attribute đã tồn tại.',
    'url' => ':attribute không đúng định dạng URL.',

    'before' => ':attribute phải trước ngày :date.',
    'before_or_equal' => ':attribute phải trước hoặc bằng ngày :date.',
    'after' => ':attribute phải sau ngày :date.',
    'after_or_equal' => ':attribute phải sau hoặc bằng ngày :date.',

    /*
    |--------------------------------------------------------------------------
    | Size Rules
    |--------------------------------------------------------------------------
    */

    'min' => [
        'string' => ':attribute phải có ít nhất :min ký tự.',
        'numeric' => ':attribute phải lớn hơn hoặc bằng :min.',
        'array' => ':attribute phải có ít nhất :min phần tử.',
        'file' => ':attribute phải có dung lượng tối thiểu :min KB.',
    ],

    'max' => [
        'string' => ':attribute không được vượt quá :max ký tự.',
        'numeric' => ':attribute không được lớn hơn :max.',
        'array' => ':attribute không được vượt quá :max phần tử.',
        'file' => ':attribute không được vượt quá :max KB.',
    ],

    'between' => [
        'string' => ':attribute phải có từ :min đến :max ký tự.',
        'numeric' => ':attribute phải nằm trong khoảng :min - :max.',
        'array' => ':attribute phải có từ :min đến :max phần tử.',
        'file' => ':attribute phải có dung lượng từ :min đến :max KB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Thuộc tính
    |--------------------------------------------------------------------------
    */

    'attributes' => [

        'first_name' => 'Tên',
        'last_name' => 'Họ',
        'full_name' => 'Họ và tên',

        'username' => 'Tên đăng nhập',
        'email' => 'Email',
        'password' => 'Mật khẩu',
        'confirm_password' => 'Xác nhận mật khẩu',

        'phone' => 'Số điện thoại',
        'address' => 'Địa chỉ',
        'date_of_birth' => 'Ngày sinh',
        'gender' => 'Giới tính',

        'avatar' => 'Ảnh đại diện',
        'logo' => 'Logo',
        'bgImage' => 'Ảnh nền',

        'name' => 'Tên',
        'slug' => 'Slug',
        'title' => 'Tiêu đề',
        'description' => 'Mô tả',

        'status' => 'Trạng thái',
        'sort_order' => 'Thứ tự',

        'count' => 'Số lượng',
    ],

    /*
    |--------------------------------------------------------------------------
    | Giá trị hiển thị
    |--------------------------------------------------------------------------
    */

    'values' => [

        'gender' => [
            'male' => 'Nam',
            'female' => 'Nữ',
            'other' => 'Khác',
        ],

        'status' => [
            'active' => 'Hoạt động',
            'inactive' => 'Ngừng hoạt động',
            'locked' => 'Đã khóa',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Messages
    |--------------------------------------------------------------------------
    */

    'required_locales' => 'Thiếu bản dịch cho các ngôn ngữ: :locales.',

    'translation_name_taken' => 'Bản dịch cho ngôn ngữ :locale đã tồn tại. Vui lòng sử dụng giá trị khác.',

    'unsupported_locales' => 'Ngôn ngữ không được hỗ trợ: :locales.',

];
