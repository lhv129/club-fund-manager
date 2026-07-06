<?php

namespace App\Domains\Example\Controllers;

use App\Base\BaseController;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Domains\Example\Requests\StoreExampleRequest;
use App\Domains\Example\Requests\UpdateExampleRequest;
use App\Domains\Example\Resources\ExampleResource;
use App\Domains\Example\Services\ExampleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExampleController extends BaseController
{
    protected $service;

    public function __construct(ExampleService $service) {
        $this->service = $service;
    }

    /**
     * GET /api/v1/examples?search=abc&is_active=1&user_id=2&sort_by=title&sort_dir=asc&limit=20&page=1
     */
    public function index(Request $request): JsonResponse
    {
        $params    = $request->only(['limit', 'page', 'search', 'is_active', 'user_id', 'sort_by', 'sort_dir']);
        $paginator = $this->service->paginate($params);

        return $this->paginateResponse($paginator, __('domains/example.list'));
    }

    /**
     * GET /api/v1/examples/active — dropdown
     */
    public function active(): JsonResponse
    {
        $data = $this->service->getActive();

        return $this->responseCommon(true, __('domains/example.active'), ExampleResource::collection($data));
    }

    /**
     * GET /api/v1/examples/meta/{slug}
     */
    public function meta(string $slug): JsonResponse
    {
        $data = $this->service->findByConditions(
            conditions: ['slug' => $slug, 'is_active' => true],
            select: ['id', 'title', 'slug', 'description'],
            orFail: true,
        );

        return $this->responseCommon(true, __('domains/example.meta'), new ExampleResource($data));
    }

    /**
     * GET /api/v1/examples/{id}
     */
    public function show(int $id): JsonResponse
    {
        $example = $this->service->findWithRelations($id, ['user']);

        return $this->responseCommon(true, __('domains/example.show'), new ExampleResource($example));
    }

    /**
     * POST /api/v1/examples
     */
    public function store(StoreExampleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id']  = JWTAuth::user()->id;
        $example = $this->service->create($data);

        return $this->responseCommon(true, __('domains/example.store'), new ExampleResource($example), 201);
    }

    /**
     * PUT /api/v1/examples/{id}
     */
    public function update(UpdateExampleRequest $request, int $id): JsonResponse
    {
        $example = $this->service->update($id, $request->validated());

        return $this->responseCommon(true, __('domains/example.update'), new ExampleResource($example));
    }

    /**
     * DELETE /api/v1/examples/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/example.destroy'));
    }

    /**
     * PATCH /api/v1/examples/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $example = $this->service->toggleStatus($id);

        return $this->responseCommon(true, __('domains/example.toggle_status'), new ExampleResource($example));
    }

    /**
     * POST /api/v1/examples/reorder
     * Body: [{ id: 1, sort_order: 2 }, { id: 2, sort_order: 1 }]
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            '*.id'         => ['required', 'integer'],
            '*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $this->service->reorder($request->all());

        return $this->responseCommon(true, __('domains/example.reorder'));
    }
}
