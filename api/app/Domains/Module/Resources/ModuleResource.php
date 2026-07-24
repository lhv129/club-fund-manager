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
            'icon'       => $this->icon,
            'is_active'  => $this->is_active,
            'sort_order' => $this->sort_order,
            'actions' => $this->whenLoaded(
                'permissions',
                fn() => $this->permissions
                    ->mapWithKeys(fn($p) => [
                        $p->action => (bool) $p->is_active,
                    ])
            ),
            'translations' => $this->whenLoaded(
                'translations',
                fn() =>
                $this->translations->map(fn($t) => [
                    'locale' => $t->locale,
                    'name'   => $t->name,
                    'description'  => $t->description,
                ])->values()
            ),
            'created_at' => $this->created_at,
        ];
    }
}
