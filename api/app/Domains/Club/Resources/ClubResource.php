<?php

namespace App\Domains\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'max_members'      => $this->max_members,
            'logo'         => $this->logo,
            'is_active'    => (bool) $this->is_active,
            'sort_order'   => $this->sort_order,
            'total_members' => $this->total_members ?? null,
            'translations' => $this->whenLoaded('translations', function () {
                return $this->translations->map(fn($t) => [
                    'locale' => $t->locale,
                    'name' => $t->name,
                    'description' => $t->description,
                    'slug' => $t->slug,
                ]);
            }),
            'created_at'   => $this->created_at?->toISOString(),
            'updated_at'   => $this->updated_at?->toISOString(),
        ];
    }
}
