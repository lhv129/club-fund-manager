<?php

namespace App\Domains\MonthlyContribution\Repositories;

use App\Base\BaseRepository;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;

class MonthlyContributionRepository extends BaseRepository
{
    public function __construct(MonthlyContribution $model)
    {
        parent::__construct($model);
    }
}
