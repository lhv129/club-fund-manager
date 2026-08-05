<?php

namespace App\Domains\FundPeriod\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FundPeriodTranslation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'fund_period_translations';

    protected $fillable = [
        'fund_period_id',
        'locale',
        'title',
        'description',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function fundPeriod(): BelongsTo
    {
        return $this->belongsTo(FundPeriod::class);
    }
}
