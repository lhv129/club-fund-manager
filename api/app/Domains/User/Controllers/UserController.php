<?php

namespace App\Domains\User\Controllers;

use App\Base\BaseController;
use App\Domains\User\Services\UserService;
use App\Domains\User\Requests\StoreUserRequest;
use App\Domains\User\Requests\UpdateUserRequest;
use App\Domains\User\Requests\UpdateUserStatusRequest;
use App\Domains\User\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseController
{
    protected $service;
    public function __construct(UserService $service)
    {
        $this->service = $service;
    }

    /**
     * GET /api/v1/users?limit=15&search=abc&status=active&sort_by=name&sort_dir=asc
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['limit', 'search', 'status', 'email_verified_at', 'sort_by', 'sort_dir', 'page']);
        $paginator = $this->service->paginate($params);
        return $this->paginateResponse($paginator, __('domains/user.list'));
    }
    /**
     * GET /api/v1/users/active?limit=15&search=abc&sort_by=name&sort_dir=asc
     */
    public function activeIndex(Request $request): JsonResponse
    {
        $params = $request->only(['limit', 'search', 'sort_by', 'sort_dir', 'page']);
        $paginator = $this->service->paginateActive($params);
        return $this->paginateResponse($paginator, __('domains/user.list'));
    }

    /**
     * GET /api/v1/users/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     *
     * Lần đầu: không cần cursor
     * Lần sau: truyền cursor từ meta.next_cursor của response trước
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        $params = $request->only(['limit', 'search', 'status']);
        $paginator = $this->service->cursorPaginate($params);

        return $this->cursorResponse($paginator, __('domains/user.list'));
    }

    /**
     * GET /api/v1/users/select
     */
    public function select(Request $request): JsonResponse
    {
        $params = $request->only(['search', 'status', 'limit']);
        $data   = $this->service->getForSelect($params);
        return $this->responseCommon(true, __('domains/user.select'), $data);
    }

    /**
     * GET /api/v1/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->service->find($id);

        return $this->responseCommon(true, __('domains/user.list'), new UserResource($user));
    }

    /**
     * POST /api/v1/users
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->service->create($request->validated());

        return $this->responseCommon(true, __('domains/user.created'), new UserResource($user), 201);
    }

    /**
     * PUT /api/v1/users/{id}
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = $this->service->update($id, $request->validated());

        return $this->responseCommon(true, __('domains/user.updated'), new UserResource($user));
    }

    /**
     * DELETE /api/v1/users/{id}
     *
     * Trả danh sách user mới của trang hiện tại sau khi xóa.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->service->delete($id);

        $params = $request->only(['limit', 'search', 'status', 'email_verified_at', 'sort_by', 'sort_dir', 'page']);
        $paginator = $this->service->paginate($params);

        return $this->paginateResponse($paginator, __('domains/user.deleted'));
    }

    /**
     * PATCH /api/v1/users/{id}/status
     */
    public function updateStatus(UpdateUserStatusRequest $request, int $id): JsonResponse
    {
        $user = $this->service->updateStatus($id, $request->validated('status'));

        return $this->responseCommon(true, __('domains/user.status_updated'), new UserResource($user));
    }
}
