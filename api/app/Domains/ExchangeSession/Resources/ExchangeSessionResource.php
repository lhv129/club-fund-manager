<?php

namespace App\Domains\ExchangeSession\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'club_id'             => $this->club_id,
            'playing_schedule_id' => $this->playing_schedule_id,
            'transaction_id'      => $this->transaction_id,
            'session_date'        => $this->session_date?->toDateString(),
            'court_name'          => $this->court_name,
            'court_address'       => $this->court_address,
            'start_time'          => $this->start_time?->format('H:i'),
            'end_time'            => $this->end_time?->format('H:i'),
            'type'                => $this->type,
            'status'              => $this->status,
            'player_count'          => $this->player_count,
            'amount_per_player'     => $this->amount_per_player,
            'total_amount'          => $this->total_amount,
            'exchange_male_amount'   => $this->exchange_male_amount,
            'exchange_female_amount' => $this->exchange_female_amount,
            'is_active'            => $this->is_active,
            'sort_order'          => $this->sort_order,

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

            'playing_schedule' => $this->whenLoaded('playingSchedule', fn () => [
                'id'      => $this->playingSchedule->id,
                'weekday' => $this->playingSchedule->weekday,
            ]),

            'players' => $this->whenLoaded('players', fn () => ExchangeSessionPlayerResource::collection($this->players)),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
