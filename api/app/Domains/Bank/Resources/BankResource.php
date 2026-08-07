<?php

namespace App\Domains\Bank\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'code' => $this->code,
            'name' => $this->name,
            'short_name' => $this->short_name,

            'logo' => $this->logo,
            'bin' => $this->bin,
            'swift_code' => $this->swift_code,

            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
