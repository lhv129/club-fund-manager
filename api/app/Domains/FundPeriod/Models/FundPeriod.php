<?php

namespace App\Domains\FundPeriod\Models;

use App\Domains\Club\Models\Club;
use App\Domains\FundPeriod\Models\FundPeriodTranslation;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class FundPeriod extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'fund_periods';

    protected $fillable = [
        'club_id',

        'year',
        'month',

        'male_amount',
        'female_amount',
        'exchange_male_amount',
        'exchange_female_amount',

        'is_locked',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'year'            => 'integer',
            'month'           => 'integer',
            'male_amount'     => 'decimal:2',
            'female_amount'   => 'decimal:2',
            'exchange_male_amount' => 'decimal:2',
            'exchange_female_amount' => 'decimal:2',
            'is_locked'       => 'boolean',
            'sort_order'      => 'integer',
            'is_active'       => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(FundPeriodTranslation::class);
    }

    public function translation(string $locale = null): HasOne
    {
        return $this->hasOne(FundPeriodTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }

    public function monthlyContributions(): HasMany
    {
        return $this->hasMany(MonthlyContribution::class, 'period_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeLocked(Builder $query): Builder
    {
        return $query->where('is_locked', true);
    }

    public function scopeUnlocked(Builder $query): Builder
    {
        return $query->where('is_locked', false);
    }
}
