<?php

namespace App\Domains\FundPeriod\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FundPeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'club_id'          => $this->club_id,
            'year'             => $this->year,
            'month'            => $this->month,
            'male_amount'      => $this->male_amount,
            'female_amount'    => $this->female_amount,
            'exchange_male_amount'  => $this->exchange_male_amount,
            'exchange_female_amount'  => $this->exchange_female_amount,
            'is_locked'        => $this->is_locked,
            'is_active'         => $this->is_active,
            'sort_order'       => $this->sort_order,

            'translations' => $this->whenLoaded('translations', function () {
                return $this->translations->map(fn ($t) => [
                    'locale'      => $t->locale,
                    'title'        => $t->title,
                    'description'  => $t->description,
                ]);
            }),

            'club' => $this->whenLoaded('club', fn () => [
                'id' => $this->club->id,
            ]),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
