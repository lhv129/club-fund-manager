<?php

namespace App\Domains\Permission\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'module_id'    => $this->module_id,
            'action'       => $this->action,
            'sort_order'   => $this->sort_order,
            'is_active'    => (bool) $this->is_active,
            'translations' => $this->whenLoaded('translations'),
            'module'       => $this->whenLoaded('module'),
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
