<?php

namespace App\Domains\Notification\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $params = (array) ($this->data ?? []);
        $clubName = $this->club?->translation?->name;
        $params['club_name'] = $clubName ?: ($params['club_name'] ?? '');
        $prefix = "domains/notification.types.{$this->type}";

        return [
            'id' => $this->id,
            'club' => $this->club ? [
                'id' => $this->club->id,
                'name' => $clubName,
            ] : null,
            'type' => $this->type,
            'title' => __($prefix.'.title', $params),
            'body' => __($prefix.'.body', $params),
            'data' => $this->data,
            'is_read' => $this->read_at !== null,
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
