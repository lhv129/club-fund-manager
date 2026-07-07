<?php

namespace App\Domains\ExchangeSession\Models;

use App\Domains\ExchangeSession\Models\ExchangeSession;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExchangeSessionPlayer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'exchange_session_id',
        'user_id',
        'status',       // 'registered' | 'attended' | 'absent'
        'note',
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function exchangeSession()
    {
        return $this->belongsTo(ExchangeSession::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeAttended($query)
    {
        return $query->where('status', 'attended');
    }

    public function scopeRegistered($query)
    {
        return $query->where('status', 'registered');
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }
}
