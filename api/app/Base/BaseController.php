<?php

namespace App\Base;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\CursorPaginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Routing\Controller;

/**
 * -------------------------------------------------------------
 *  Base Laravel API
 *  Author : vietlh
 *  Email  : vietlh.hn@gmail.com
 *  Created: 2026
 *  License: Private / MIT
 * -------------------------------------------------------------
 */

abstract class BaseController extends Controller
{
    protected function responseCommon(
        bool $status,
        string $message = '',
        $data = null,
        int $httpCode = 200
    ): JsonResponse {

        $allowedCodes = [
            200, // OK
            201, // Created
            400, // Bad request
            401, // Unauthorized
            403, // Forbidden
            404, // Not found
            422, // Validation
            500  // Server error
        ];

        if (!in_array($httpCode, $allowedCodes)) {
            $httpCode = 500;
        }

        return response()->json([
            'success' => $status,
            'message' => $message,
            'data' => $data
        ], $httpCode);
    }

    protected function paginateResponse(
        LengthAwarePaginator $paginator,
        string $message = '',
        ?string $resource = null,
    ): JsonResponse {

        $items = $resource
            ? $resource::collection($paginator->items())->resolve()
            : $paginator->items();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $items,
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Response chuẩn cho cursor pagination
     * Thay thế paginateResponse() khi dùng cursorPaginate()
     */
    protected function cursorResponse(
        CursorPaginator $paginator,
        string $message = '',
        ?string $resource = null,
    ): JsonResponse {

        $items = $resource
            ? $resource::collection($paginator->items())->resolve()
            : $paginator->items();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $items,
            'meta' => [
                'limit' => $paginator->perPage(),
                'has_more' => $paginator->hasMorePages(),
                'next_cursor' => $paginator->nextCursor()?->encode(),
                'prev_cursor' => $paginator->previousCursor()?->encode(),
            ],
        ]);
    }
}
