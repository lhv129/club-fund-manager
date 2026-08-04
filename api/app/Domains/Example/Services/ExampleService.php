<?php

namespace App\Domains\Example\Services;

use App\Base\BaseService;
use App\Domains\Example\Models\Example;
use App\Domains\Example\Repositories\ExampleRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExampleService extends BaseService
{
    protected string $notFoundMessage = 'domains/example.not_found';

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
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    /**
     * GET /api/v1/examples/cursor — infinite scroll.
     */
    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->getCursorList($filters);
    }

    /**
     * GET /api/v1/examples/select — dropdown.
     */
    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    /**
     * find() kế thừa từ BaseService — throw 404 với $this->notFoundMessage.
     */
    public function find($id): Example
    {
        return parent::find($id);
    }

    /**
     * Tìm kèm relations.
     */
    public function findWithRelations(int $id, array $with = []): Example
    {
        $example = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$example) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $example;
    }

    /**
     * Tìm theo slug — throw 404 nếu không có.
     * findBySlug() kế thừa sẵn từ BaseRepository.
     */
    public function findBySlug(string $slug): Example
    {
        $example = $this->repository->findBySlug($slug);

        if (!$example) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $example;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): Example
    {
        // Sinh slug nếu client không truyền — Model boot() cũng tự sinh,
        // nhưng đặt ở đây để dễ trace và test business rule.
        if (empty($data['slug']) && !empty($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        // Auto sort_order = max + 1 nếu không truyền
        if (empty($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        }

        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Example
    {
        // Đổi title mà chưa truyền slug mới → sinh lại slug theo title
        if (isset($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        return parent::update($id, $data);
    }

    /**
     * Reorder khi kéo thả.
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
}
