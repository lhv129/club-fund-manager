<?php

namespace App\Domains\Module\Resources;

use App\Domains\Permission\Resources\PermissionResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'slug'        => $this->slug,
            'icon'        => $this->icon,
            'sort_order'  => $this->sort_order,
            'is_active'   => (bool) $this->is_active,
            'translations' => $this->whenLoaded('translations'),
            'permissions'  => PermissionResource::collection($this->whenLoaded('permissions')),
            'created_at'  => $this->created_at?->toIso8601String(),
            'updated_at'  => $this->updated_at?->toIso8601String(),
        ];
    }
}
