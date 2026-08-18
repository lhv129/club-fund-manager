<?php

namespace App\Domains\Dashboard\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_date' => $this->session_date?->toDateString(),
            'court_name' => $this->court_name,
            'court_address' => $this->court_address,
            'start_time' => $this->start_time?->format('H:i'),
            'end_time' => $this->end_time?->format('H:i'),
            'status' => $this->status,
            'type' => $this->type,
            'player_count' => $this->player_count,
            'total_amount' => $this->total_amount,
            'amount_per_player' => $this->amount_per_player,
        ];
    }
}
