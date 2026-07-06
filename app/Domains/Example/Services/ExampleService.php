<?php

namespace App\Domains\Example\Services;

use App\Base\BaseService;
use App\Domains\Example\Models\Example;
use App\Domains\Example\Repositories\ExampleRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExampleService extends BaseService
{
    protected string $notFoundMessage = 'domains/example.not_found';
    protected object $repository;

    public function __construct(ExampleRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/examples
     *   ?search=abc &is_active=1 &user_id=2 &sort_by=title &sort_dir=asc &limit=20 &page=1
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            where: $this->buildExampleWhere($params),
            orderBy: $this->buildOrderBy($params, ['id', 'title', 'sort_order', 'created_at']),
            select: ['id', 'user_id', 'title', 'slug', 'is_active', 'sort_order', 'created_at'],
            with: ['user:id,name'],
            limit: (int) ($params['limit'] ?? 0),
            page: (int) ($params['page']  ?? 0),
        );
    }

    /**
     * GET /api/v1/examples/active — dropdown
     * Dùng scopeActive() trên Model → where is_active = true
     */
    public function getActive(): Collection
    {
        return $this->repository->getActive(
            select: ['id', 'title', 'slug'],
        );
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    /**
     * find() kế thừa từ BaseService — không cần override
     * BaseService::find() đã throw 404 với $this->notFoundMessage
     */
    public function find($id): Example
    {
        return parent::find($id);
    }

    /**
     * Tìm kèm relations
     */
    public function findWithRelations(int $id, array $with = []): Example
    {
        $example = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$example) {
            throw new ApiException($this->notFoundMessage, 404);
        }

        return $example;
    }

    /**
     * Tìm theo slug — throw 404 nếu không có
     */
    public function findBySlug(string $slug): Example
    {
        $example = $this->repository->findBySlug($slug);

        if (!$example) {
            throw new ApiException($this->notFoundMessage, 404);
        }

        return $example;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): Example
    {
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        if (empty($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        }

        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Example
    {
        if (isset($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        return parent::update($id, $data);
    }

    /**
     * Reorder khi kéo thả
     *
     * $data = [['id' => 1, 'sort_order' => 2], ['id' => 2, 'sort_order' => 1]]
     */
    public function reorder(array $data): bool
    {
        DB::beginTransaction();

        try {
            foreach ($data as $item) {
                $this->repository->editWhere(
                    where: ['id' => $item['id']],
                    data: ['sort_order' => $item['sort_order']],
                );
            }

            DB::commit();
            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * FIX: đổi tên thành buildExampleWhere để tránh conflict P1038 với BaseService::buildWhere()
     */
    private function buildExampleWhere(array $params): array
    {
        // Equality + is_active
        $where = $this->buildWhere($params, ['user_id']);

        // is_active nhận '1','0',true,false — filter_var để convert đúng kiểu
        if (isset($params['is_active']) && $params['is_active'] !== '') {
            $active = filter_var($params['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($active)) {
                $where['is_active'] = $active;
            }
        }

        // Search theo title — dùng buildSearchWhere từ Base
        return array_merge(
            $where,
            $this->buildSearchWhere($params, ['title']),
        );
    }
}
