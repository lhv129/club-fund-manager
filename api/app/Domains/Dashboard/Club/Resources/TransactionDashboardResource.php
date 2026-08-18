<?php

namespace App\Domains\Dashboard\Club\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'source' => $this->source,
            'amount' => $this->amount,
            'description' => $this->description,
            'reference_code' => $this->reference_code,
            'transaction_date' => $this->transaction_date?->toISOString(),
            'sender_name' => $this->sender_name,
        ];
    }
}
