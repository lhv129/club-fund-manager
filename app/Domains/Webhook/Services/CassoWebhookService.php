<?php

namespace App\Domains\Webhook\Services;

use App\Base\BaseService;
use App\Domains\Webhook\Repositories\CassoWebhookRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class CassoWebhookService extends BaseService
{
    protected object $repository;

    public function __construct(
        CassoWebhookRepository $repository
    ) {
        parent::__construct($repository);
    }

    public function handleWebhook(Request $request): void
    {
        if (!$this->verifySignature($request)) {
            throw new UnauthorizedHttpException('', 'Invalid Casso signature');
        }

        // Sau khi verify thành công mới xử lý dữ liệu
        $this->repository->logWebhook(
            $request->headers->all(),
            json_decode($request->getContent(), true)
        );
    }

    /**
     * Verify Casso Webhook Signature
     */
    private function verifySignature(Request $request): bool
    {
        $signatureHeader = $request->header('x-casso-signature');

        if (empty($signatureHeader)) {
            return false;
        }

        preg_match('/t=(\d+),v1=([a-f0-9]+)/', $signatureHeader, $matches);

        if (count($matches) !== 3) {
            return false;
        }

        $timestamp = $matches[1];
        $receivedSignature = $matches[2];

        // Lấy RAW JSON từ request
        $rawBody = $request->getContent();

        // Decode thành array
        $payload = json_decode($rawBody, true);

        if (!is_array($payload)) {
            return false;
        }

        // Sort key giống sample của Casso
        $payload = $this->sortObjDataByKey($payload);

        $message = $timestamp . '.' . json_encode(
            $payload,
            JSON_UNESCAPED_SLASHES
        );

        $generatedSignature = hash_hmac(
            'sha512',
            $message,
            config('services.casso.webhook_secret')
        );

        Log::info([
            'rawBody' => $rawBody,
            'message' => $message,
            'receivedSignature' => $receivedSignature,
            'generatedSignature' => $generatedSignature,
            'verifyResult' => hash_equals($generatedSignature, $receivedSignature),
        ]);

        return hash_equals($generatedSignature, $receivedSignature);
    }

    /**
     * Sort object recursively by key
     */
    private function sortObjDataByKey(array $data): array
    {
        ksort($data);

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->sortObjDataByKey($value);
            }
        }

        return $data;
    }
}
