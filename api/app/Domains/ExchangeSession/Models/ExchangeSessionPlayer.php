<?php

namespace App\Domains\ExchangeSession\Models;

use App\Domains\Transaction\Models\Transaction;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExchangeSessionPlayer extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'exchange_session_players';

    protected $fillable = [
        'exchange_session_id',
        'user_id',          // nullable — member mang nhóm giao lưu đến; NULL = người lạ
        'player_name',      // JSON mảng tên (dành cho người lạ / ghi chú)
        'male',             // số lượng nam trong nhóm giao lưu
        'female',           // số lượng nữ trong nhóm giao lưu
        'transaction_id',   // nullable — admin gắn tay để set paid=1

        'amount',           // tự tính = male×exchange_male_amount + female×exchange_female_amount
        'paid',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'player_name' => 'array',     // JSON ↔ PHP array
            'male'         => 'integer',
            'female'       => 'integer',
        'amount'     => 'decimal:2',
        'paid'       => 'boolean',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function exchangeSession(): BelongsTo
    {
        return $this->belongsTo(ExchangeSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('paid', true);
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->where('paid', false);
    }

}
