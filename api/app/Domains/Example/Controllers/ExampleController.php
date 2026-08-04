<?php

namespace App\Domains\Example\Controllers;

use App\Base\BaseController;
use App\Domains\Example\Requests\FilterExampleRequest;
use App\Domains\Example\Requests\ReorderExampleRequest;
use App\Domains\Example\Requests\StoreExampleRequest;
use App\Domains\Example\Requests\UpdateExampleRequest;
use App\Domains\Example\Resources\ExampleResource;
use App\Domains\Example\Services\ExampleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class ExampleController extends BaseController
{
    public function __construct(protected ExampleService $service) {}

    /**
     * GET /api/v1/examples?search=abc&is_active=1&user_id=2&sort_by=title&sort_dir=asc&limit=20&page=1
     */
    public function index(FilterExampleRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/example.list'),
            ExampleResource::class,
        );
    }

    /**
     * GET /api/v1/examples/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->only(['limit', 'search', 'is_active', 'user_id'])),
            __('domains/example.list'),
            ExampleResource::class,
        );
    }

    /**
     * GET /api/v1/examples/select — dropdown, không Resource, không phân trang.
     */
    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/example.select'),
            $this->service->getForSelect($request->only(['search', 'is_active', 'user_id', 'limit'])),
        );
    }

    /**
     * GET /api/v1/examples/slug/{slug}
     */
    public function showBySlug(string $slug): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/example.detail'),
            new ExampleResource($this->service->findBySlug($slug)),
        );
    }

    /**
     * GET /api/v1/examples/{id}
     */
    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/example.detail'),
            new ExampleResource($this->service->findWithRelations($id, ['user'])),
        );
    }

    /**
     * POST /api/v1/examples
     */
    public function store(StoreExampleRequest $request): JsonResponse
    {
        $data             = $request->validated();
        $data['user_id']  = JWTAuth::user()->id;

        return $this->responseCommon(
            true,
            __('domains/example.created'),
            new ExampleResource($this->service->create($data)),
            201,
        );
    }

    /**
     * PUT /api/v1/examples/{id}
     */
    public function update(UpdateExampleRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/example.updated'),
            new ExampleResource($this->service->update($id, $request->validated())),
        );
    }

    /**
     * DELETE /api/v1/examples/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/example.deleted'));
    }

    /**
     * PATCH /api/v1/examples/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/example.status_toggled'),
            new ExampleResource($this->service->toggleStatus($id)),
        );
    }

    /**
     * POST /api/v1/examples/reorder — kéo thả sort_order.
     * Body: [{ id: 1, sort_order: 2 }, { id: 2, sort_order: 1 }]
     */
    public function reorder(ReorderExampleRequest $request): JsonResponse
    {
        $this->service->reorder($request->validated());

        return $this->responseCommon(true, __('domains/example.reordered'));
    }
}
