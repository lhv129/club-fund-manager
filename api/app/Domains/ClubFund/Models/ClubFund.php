<?php

namespace App\Domains\ClubFund\Models;

use App\Domains\Club\Models\Club;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClubFund extends Model
{
    protected $fillable = ['club_id', 'balance'];

    protected function casts(): array
    {
        return ['balance' => 'decimal:2'];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
