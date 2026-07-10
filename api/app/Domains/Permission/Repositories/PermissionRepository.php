<?php

namespace App\Domains\Permission\Repositories;

use App\Base\BaseRepository;
use App\Domains\Permission\Models\Permission;

class PermissionRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Permission $model)
    {
        parent::__construct($model);
    }

    // BaseRepository đã cung cấp đủ:
    // - paginate(), get(), first(), find()
    // - createWithTranslations(), updateWithTranslations()
    // - getNextSortOrder(), applySortOrder(), decrementSortOrderAfterDelete()
    //
    // Chỉ thêm method khi query vượt ngoài khả năng applyConditions().
}
