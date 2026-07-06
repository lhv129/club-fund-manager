<?php

namespace App\Domains\User\Models;

use Illuminate\Database\Eloquent\Model;

class UserRefreshToken extends Model
{

    protected $table = 'user_refresh_tokens';

    protected $fillable = [
        'user_id',
        'token',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime'
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
