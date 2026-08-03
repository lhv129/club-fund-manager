<?php

namespace App\Domains\ClubMemberRole\Resources;

use App\Domains\Role\Resources\RoleResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubMemberRoleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'club_id' => $this->club_id,
            'user_id' => $this->user_id,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,

            'role' => new RoleResource($this->whenLoaded('role')),

            // 'club' => $this->whenLoaded('club', function () {
            //     return [
            //         'id' => $this->club->id,
            //         'logo' => $this->club->logo,
            //         'max_members' => $this->club->max_members,
            //         'is_active' => $this->club->is_active,

            //         'translation' => $this->club->relationLoaded('translation')
            //             ? optional($this->club->translation)->only([
            //                 'locale',
            //                 'name',
            //                 'description',
            //             ])
            //             : null,

            //         'translations' => $this->club->relationLoaded('translations')
            //             ? $this->club->translations->map(fn($translation) => [
            //                 'locale' => $translation->locale,
            //                 'name' => $translation->name,
            //                 'description' => $translation->description,
            //             ])->values()
            //             : null,
            //     ];
            // }),
        ];
    }
}
