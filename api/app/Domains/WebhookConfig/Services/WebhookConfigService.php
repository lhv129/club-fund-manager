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

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->getCursorList($filters);
    }

    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find(int $id, ?int $clubId = null): WebhookConfig
    {
        $config = $this->repository->findForClub($id, $clubId);

        if (! $config) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $config;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo webhook config cho club.
     */
    public function create(array $data): WebhookConfig
    {
        $bankAccountId = (int) $data['bank_account_id'];
        $type = $data['type'];

        if ($this->repository->existsByBankAccountAndType(
            $bankAccountId,
            $type,
        )) {
            throw new ApiException(
                __('domains/webhook_config.duplicate_bank_account_type', [
                    'type' => $type,
                ]),
                422,
                'DUPLICATE_BANK_ACCOUNT_TYPE',
            );
        }

        $data['webhook_token'] = Str::random(40);

        $data['webhook_url'] = rtrim(config('app.url'), '/') .
            "/api/v1/sepay/webhook/{$data['webhook_token']}";

        $data['sort_order'] = 0;
        $data['is_active'] = true;

        return $this->repository->create($data);
    }

    /**
     * Cập nhật webhook config.
     */
    public function update(int $id, array $data, ?int $clubId = null): WebhookConfig
    {
        $current = $this->find($id, $clubId);

        $bankAccountId = (int) (
            $data['bank_account_id']
            ?? $current->bank_account_id
        );

        $type = $data['type'] ?? $current->type;

        if ($this->repository->existsByBankAccountAndType(
            $bankAccountId,
            $type,
            $id,
        )) {
            throw new ApiException(
                __('domains/webhook_config.duplicate_bank_account_type', [
                    'type' => $type,
                ]),
                422,
                'DUPLICATE_BANK_ACCOUNT_TYPE',
            );
        }

        // Xác định giá trị cuối cùng sau khi update
        $webhookSecret = $data['webhook_secret'] ?? $current->webhook_secret;

        $webhookUrl = $data['webhook_url']
            ?? $current->webhook_url;

        // Có đủ secret + URL thì verified
        $data['is_verified'] = !empty($webhookSecret)
            && !empty($webhookUrl);

        unset($data['club_id']);

        return $this->repository->update($current, $data);
    }

    public function deleteForClub(int $id, ?int $clubId = null): bool
    {
        $config = $this->find($id, $clubId);

        return $this->repository->delete($config);
    }
}
