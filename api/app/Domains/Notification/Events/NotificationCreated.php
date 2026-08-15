<?php

namespace App\Domains\Notification\Events;

use App\Domains\Notification\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Notification $notification) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->notification->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastWith(): array
    {
        $this->notification->loadMissing('club.translation');
        $clubName = $this->notification->club?->translation?->name;

        return [
            'notification' => [
                'id' => $this->notification->id,
                'club' => $this->notification->club ? [
                    'id' => $this->notification->club->id,
                    'name' => $clubName,
                ] : null,
                'type' => $this->notification->type,
                'title_key' => "notifications.types.{$this->notification->type}.title",
                'body_key' => "notifications.types.{$this->notification->type}.body",
                'data' => $this->notification->data,
                'is_read' => false,
                'read_at' => null,
                'created_at' => $this->notification->created_at?->toISOString(),
            ],
            'unread_count' => Notification::query()
                ->where('user_id', $this->notification->user_id)
                ->whereNull('read_at')
                ->count(),
        ];
    }
}
