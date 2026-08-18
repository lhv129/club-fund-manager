<?php

namespace App\Domains\ExchangeSession\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeSessionPlayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'exchange_session_id' => $this->exchange_session_id,
            'user_id'             => $this->user_id,
            'group_name'         => $this->group_name,
            'male'                => $this->male,
            'female'              => $this->female,
            'transaction_id'      => $this->transaction_id,
            'amount'              => $this->amount,
            'paid'                => $this->paid,
            'warning'             => (bool) ($this->warning ?? false),
            'warning_level'       => $this->warning_level ?? 'none',
            'warning_message'     => $this->warning_message,
            'is_active'           => $this->is_active,
            'sort_order'          => $this->sort_order,

            'user' => $this->whenLoaded('user', fn() => [
                'id'       => $this->user->id,
                'fullname' => $this->user->fullname,
            ]),

            'exchange_session' => $this->whenLoaded('exchangeSession', function () {
                $session = $this->exchangeSession;
                $schedule = $session->playingSchedule;
                $translations = $schedule?->translations ?? collect(config('app.supported_locales', []))
                    ->map(fn (string $locale) => [
                        'locale' => $locale,
                        'title' => __('domains/exchange_session.manual_title', [], $locale),
                    ]);

                $current = $translations->firstWhere('locale', app()->getLocale())
                    ?? $translations->first();

                return [
                    'id' => $session->id,
                    'session_date' => $session->session_date?->format('Y-m-d'),
                    'type' => $session->type,
                    'status' => $session->status,
                    'playing_schedule' => [
                        'id' => $schedule?->id,
                        'title' => is_array($current) ? $current['title'] : $current?->title,
                        'translations' => $translations->map(fn ($translation) => [
                            'locale' => is_array($translation) ? $translation['locale'] : $translation->locale,
                            'title' => is_array($translation) ? $translation['title'] : $translation->title,
                            ...(!is_array($translation) && isset($translation->note) ? ['note' => $translation->note] : []),
                        ])->values()->all(),
                    ],
                ];
            }),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
