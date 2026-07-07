<?php

namespace App\Helpers;

use App\Domains\User\Models\User;


class UserNameHelper
{
    /**
     * Sinh username duy nhất kiểu guest, guest1, guest2...
     *
     * @return string
     */
    public static function generateGuestUserName(): string
    {
        $base = 'guest';
        $username = $base;
        $counter = 1;

        // Kiểm tra username đã tồn tại chưa
        while (User::where('username', $username)->exists()) {
            $username = $base . $counter; // guest1, guest2...
            $counter++;
        }

        return $username;
    }
}
