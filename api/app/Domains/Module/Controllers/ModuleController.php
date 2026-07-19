<?php

namespace App\Domains\Module\Controllers;

use App\Base\BaseController;
use App\Domains\Module\Requests\FilterModuleRequest;
use App\Domains\Module\Requests\StoreModuleRequest;
use App\Domains\Module\Requests\UpdateModuleRequest;
use App\Domains\Module\Resources\ModuleResource;
use App\Domains\Module\Services\ModuleService;
use Illuminate\Http\JsonResponse;

class ModuleController extends BaseController
{
    protected object $service;

    public function __construct(ModuleService $service)
    {
        $this->service = $service;
    }

    public function index(FilterModuleRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/module.list')
        );
    }

    public function select(FilterModuleRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.select'),
            $this->service->getForSelect($request->validated())
        );
    }

    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.detail'),
            new ModuleResource($this->service->find($id))
        );
    }

    public function store(StoreModuleRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.created'),
            new ModuleResource($this->service->create($request->validated())),
            201
        );
    }

    public function update(UpdateModuleRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.updated'),
            new ModuleResource($this->service->update($id, $request->validated()))
        );
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->responseCommon(true, __('domains/module.deleted'));
    }

    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.status_toggled'),
            new ModuleResource($this->service->toggleStatus($id))
        );
    }
}
