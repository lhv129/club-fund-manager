<?php

namespace App\Domains\BankAccount\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'club_id'       => $this->club_id,
            'bank_code'        => $this->bank_code,
            'bank_name' => $this->bank_name,
            'account_number'   => $this->account_number,
            'account_name'  => $this->account_name,

            'qr_image' => $this->qr_image,
            'sort_order'   => $this->sort_order,
            'is_active'  => $this->is_active,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
