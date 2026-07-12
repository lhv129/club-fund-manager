<?php

/**
 * VALIDATION LANGUAGE FILE
 * ------------------------------------------
 * Laravel built-in validation messages
 */

return [

    'required' => 'The :attribute field is required.',
    'string'   => 'The :attribute must be a string.',
    'email'    => 'The :attribute must be a valid email address.',
    'unique'   => 'The :attribute has already been taken.',
    'integer'  => 'The :attribute must be an integer.',
    'in'       => 'The selected :attribute is invalid.',

    'min' => [
        'string' => 'The :attribute must be at least :min characters.',
        'numeric' => 'The :attribute must be at least :min.',
        'file' => 'The :attribute must be at least :min KB.',
    ],

    'max' => [
        'string' => 'The :attribute may not be greater than :max characters.',
        'file' => 'The :attribute may not be greater than :max KB.',
    ],

    'same'  => 'The :attribute and :other must match.',
    'image' => 'The :attribute must be an image.',
    'mimes' => 'The :attribute must be a file of type: :values.',

    'attributes' => [

        'first_name' => 'first name',
        'last_name'  => 'last name',
        'username'   => 'username',
        'email'      => 'email',
        'password'   => 'password',
        'confirm_password' => 'confirm password',

        'avatar'  => 'avatar',
        'bgImage' => 'background image',

        'count' => 'count',
        'description' => 'description',
    ],

    'values' => [
        'gender' => [
            'male'   => 'Male',
            'female' => 'Female',
            'other'  => 'Other',
        ],
    ],

    'required_locales' => 'Missing translations for locales: :locales.',
    'translation_name_taken' => 'The :locale translation for :attribute has already been taken.',
    'unsupported_locales' => 'Invalid Locale: :locales.',

];
