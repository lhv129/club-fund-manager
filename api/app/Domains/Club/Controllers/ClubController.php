<?php

namespace App\Domains\Club\Controllers;

use App\Base\BaseController;
use App\Domains\Club\Requests\FilterClubRequest;
use App\Domains\Club\Services\ClubService;
use Illuminate\Http\JsonResponse;

class ClubController extends BaseController
{
    public function __construct(
        protected ClubService $clubService
    ) {}

    public function index(FilterClubRequest $request): JsonResponse
    {
        $clubs = $this->clubService->index(
            $request->user(),
            $request->validated()
        );

        return $this->paginateResponse($clubs, 'Lấy danh sách câu lạc bộ thành công');
    }
}
