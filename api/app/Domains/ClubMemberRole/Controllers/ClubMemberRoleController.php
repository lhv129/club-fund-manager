<?php

namespace App\Domains\ClubMemberRole\Controllers;

use App\Base\BaseController;
use App\Domains\ClubMemberRole\Requests\SyncClubMemberRoleRequest;
use App\Domains\ClubMemberRole\Resources\ClubMemberRoleResource;
use App\Domains\ClubMemberRole\Services\ClubMemberRoleService;


class ClubMemberRoleController extends BaseController
{
    protected object $service;
    public function __construct(
        ClubMemberRoleService $service
    ) {
        $this->service = $service;
    }

    public function syncClubMemberRole(SyncClubMemberRoleRequest $request)
    {
        $data = $this->service->syncClubMemberRole($request->validated());
        return $this->responseCommon(true, __('domains/clubMemberRole.sync_role_success'), new ClubMemberRoleResource($data), 200);
    }
}
