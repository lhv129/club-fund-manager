<?php

/**
 * VALIDATION LANGUAGE FILE
 * ------------------------------------------
 * Laravel built-in validation messages
 *
 * Shared validation messages for the entire application.
 * FormRequest classes should only contain rules().
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Basic Rules
    |--------------------------------------------------------------------------
    */

    'accepted' => 'The :attribute must be accepted.',
    'array' => 'The :attribute must be an array.',
    'boolean' => 'The :attribute field must be true or false.',
    'confirmed' => 'The :attribute confirmation does not match.',
    'date' => 'The :attribute is not a valid date.',
    'date_format' => 'The :attribute must match the format :format.',
    'different' => 'The :attribute and :other must be different.',
    'digits' => 'The :attribute must be :digits digits.',
    'digits_between' => 'The :attribute must be between :min and :max digits.',
    'email' => 'The :attribute must be a valid email address.',
    'exists' => 'The selected :attribute is invalid.',
    'file' => 'The :attribute must be a file.',
    'image' => 'The :attribute must be an image.',
    'in' => 'The :attribute must be one of: :values.',
    'integer' => 'The :attribute must be an integer.',
    'mimes' => 'The :attribute must be a file of type: :values.',
    'nullable' => 'The :attribute field is optional.',
    'numeric' => 'The :attribute must be a number.',
    'regex' => 'The :attribute format is invalid.',
    'required' => 'The :attribute field is required.',
    'same' => 'The :attribute and :other must match.',
    'string' => 'The :attribute must be a string.',
    'unique' => 'The :attribute has already been taken.',
    'url' => 'The :attribute format is invalid.',

    'before' => 'The :attribute must be a date before :date.',
    'before_or_equal' => 'The :attribute must be a date before or equal to :date.',
    'after' => 'The :attribute must be a date after :date.',
    'after_or_equal' => 'The :attribute must be a date after or equal to :date.',

    /*
    |--------------------------------------------------------------------------
    | Size Rules
    |--------------------------------------------------------------------------
    */

    'min' => [
        'string' => 'The :attribute must be at least :min characters.',
        'numeric' => 'The :attribute must be at least :min.',
        'array' => 'The :attribute must have at least :min items.',
        'file' => 'The :attribute must be at least :min KB.',
    ],

    'max' => [
        'string' => 'The :attribute may not be greater than :max characters.',
        'numeric' => 'The :attribute may not be greater than :max.',
        'array' => 'The :attribute may not have more than :max items.',
        'file' => 'The :attribute may not be greater than :max KB.',
    ],

    'between' => [
        'string' => 'The :attribute must be between :min and :max characters.',
        'numeric' => 'The :attribute must be between :min and :max.',
        'array' => 'The :attribute must have between :min and :max items.',
        'file' => 'The :attribute must be between :min and :max KB.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Attribute Names
    |--------------------------------------------------------------------------
    */

    'attributes' => [

        'first_name' => 'first name',
        'last_name' => 'last name',
        'full_name' => 'full name',

        'username' => 'username',
        'email' => 'email',
        'password' => 'password',
        'confirm_password' => 'confirm password',

        'phone' => 'phone number',
        'address' => 'address',
        'date_of_birth' => 'date of birth',
        'gender' => 'gender',

        'avatar' => 'avatar',
        'logo' => 'logo',
        'bgImage' => 'background image',

        'name' => 'name',
        'slug' => 'slug',
        'title' => 'title',
        'description' => 'description',

        'status' => 'status',
        'sort_order' => 'sort order',

        'count' => 'count',
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Values
    |--------------------------------------------------------------------------
    */

    'values' => [

        'gender' => [
            'male' => 'Male',
            'female' => 'Female',
            'other' => 'Other',
        ],

        'status' => [
            'active' => 'Active',
            'inactive' => 'Inactive',
            'locked' => 'Locked',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Messages
    |--------------------------------------------------------------------------
    */

    'required_locales' => 'Missing translations for locales: :locales.',

    'translation_name_taken' => 'This translation already exists for locale :locale. Please choose another value.',

    'unsupported_locales' => 'Unsupported locales: :locales.',

];
