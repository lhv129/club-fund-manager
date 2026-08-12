<?php

namespace App\Domains\Example\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExampleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'image_path' => $this->image_path,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,

            // Chỉ hiện user nếu đã được eager load — tránh N+1.
            // User model dùng cột `fullname` (không có `name`).
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'fullname' => $this->user->fullname,
            ]),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
