<?php

namespace App\Domains\PlayingSchedule\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlayingScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'club_id'        => $this->club_id,
            'weekday'         => $this->weekday,
            'court_name'      => $this->court_name,
            'court_address'   => $this->court_address,
            'start_time'      => $this->start_time?->format('H:i'),
            'end_time'        => $this->end_time?->format('H:i'),
            'auto_generate'   => $this->auto_generate,
            'weeks_ahead'     => $this->weeks_ahead,
            'start_date'      => $this->start_date?->toDateString(),
            'end_date'        => $this->end_date?->toDateString(),
            'is_active'        => $this->is_active,
            'sort_order'      => $this->sort_order,

            'translations' => $this->whenLoaded('translations', function () {
                return $this->translations->map(fn ($t) => [
                    'locale' => $t->locale,
                    'title'  => $t->title,
                    'note'   => $t->note,
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
