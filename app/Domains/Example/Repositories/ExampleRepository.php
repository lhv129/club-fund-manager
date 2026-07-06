<?php

namespace App\Domains\Example\Repositories;

use App\Base\BaseRepository;
use App\Domains\Example\Models\Example;
use Illuminate\Database\Eloquent\Collection;

class ExampleRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Override sort mặc định cho domain này
    // User dùng created_at/desc, Example dùng sort_order/asc
    // ------------------------------------------------------------------
    protected string $defaultOrderBy = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Example $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Custom methods — chỉ thêm những gì BASE không có
    // ------------------------------------------------------------------

    /**
     * Lấy tất cả example của 1 user cụ thể
     *
     * Dùng: $exampleRepository->getByUser(1)
     */
    public function getByUser(int $userId): Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->orderBy($this->defaultOrderBy, $this->defaultOrderDirection)
            ->get();
    }

    /**
     * Tìm theo slug — kế thừa từ Base (đã có sẵn findBySlug())
     * Không cần viết lại, nhắc để biết:
     *
     * $this->repository->findBySlug('ten-slug')
     * $this->repository->findBySlug('ten-slug', ['id','title'], ['user_id' => 1])
     */
}
