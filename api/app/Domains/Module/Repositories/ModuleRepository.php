<?php

namespace App\Domains\Module\Repositories;

use App\Base\BaseRepository;
use App\Domains\Module\Models\Module;

class ModuleRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Module $model)
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
