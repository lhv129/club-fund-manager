<?php

namespace App\Domains\Module\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'module_id'  => $this->id,
            'module'     => $this->slug,
            'label'      => $this->whenLoaded(
                'translations',
                fn() =>
                $this->translations->firstWhere('locale', app()->getLocale())?->name
                    ?? $this->translations->first()?->name
            ),
            'icon'       => $this->icon,
            'is_active'  => $this->is_active,
            'sort_order' => $this->sort_order,
            'actions'    => $this->whenLoaded(
                'permissions',
                fn() =>
                $this->permissions->map(fn($p) => [
                    'id'        => $p->id,
                    'name'      => $p->action,
                    'is_active' => (bool) $p->is_active,
                ])->values()
            ),
            'translations' => $this->whenLoaded(
                'translations',
                fn() =>
                $this->translations->map(fn($t) => [
                    'locale' => $t->locale,
                    'name'   => $t->name,
                ])->values()
            ),
            'created_at' => $this->created_at,
        ];
    }
}
