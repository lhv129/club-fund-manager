<?php

namespace App\Domains\WebhookConfig\Services;

use App\Base\BaseService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use App\Domains\WebhookConfig\Repositories\WebhookConfigRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class WebhookConfigService extends BaseService
{
    protected string $notFoundMessage = 'domains/webhook_config.not_found';

    public function __construct(
        WebhookConfigRepository $repository,
        protected ClubRepository $clubRepository,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/webhook-configs
     *
     * Inject club_id từ clubSlug — business rule, không phải query builder.
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    /**
     * GET /api/v1/webhook-configs/cursor
     */
    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->getCursorList($filters);
    }

    /**
     * GET /api/v1/webhook-configs/select — dropdown.
     */
    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find(int $id): WebhookConfig
    {
        return parent::find($id);
    }

    /**
     * Tìm kèm relations.
     */
    public function findWithRelations(int $id, array $with = []): WebhookConfig
    {
        $webhookConfig = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$webhookConfig) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $webhookConfig;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo webhook config cho club.
     * club_id inject từ clubSlug (business rule).
     */
    public function create(array $data): WebhookConfig
    {
        // Tự sinh token ngẫu nhiên 40 ký tự
        $token = Str::random(40);
        $data['webhook_token'] = $token;
        // Tự sinh webhook_url dựa trên token (admin chỉ cần copy)
        $data['webhook_url'] = url("/api/v1/sepay/webhook/{$token}");
        if (empty($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        }
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): WebhookConfig
    {
        return parent::update($id, $data);
    }
}
