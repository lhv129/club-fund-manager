<?php

namespace App\Domains\Role\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'club_id'     => $this->club_id,
            'slug'        => $this->slug,
            'sort_order'  => $this->sort_order,
            'is_active'   => (bool) $this->is_active,
            'translations' => $this->whenLoaded('translations'),
            'permissions'  => $this->whenLoaded('permissions', function () {
                return $this->permissions->map(fn($p) => [
                    'id'           => $p->id,
                    'module_id'    => $p->module_id,
                    'action'       => $p->action,
                    'is_active'    => (bool) $p->pivot->is_active,
                    'translations' => $p->relationLoaded('translations') ? $p->translations : [],
                ]);
            }),
            'created_at'  => $this->created_at?->toIso8601String(),
            'updated_at'  => $this->updated_at?->toIso8601String(),
        ];
    }
}
