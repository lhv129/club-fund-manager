<?php

namespace App\Domains\MemberPaymentCode\Models;

use App\Domains\Club\Models\Club;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberPaymentCode extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'user_id',
        'code',         // mã nội dung CK duy nhất trong club, dùng để match webhook
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
    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'payment_code_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
