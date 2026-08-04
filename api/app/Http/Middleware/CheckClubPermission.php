<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Domains\Club\Models\Club;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Middleware kiểm tra CLUB SCOPE permission.
 *
 * Dùng cho các route cần xác định club cụ thể từ {id} hoặc {slug}.
 * Resolve club_id → check nested `club_{id}` key trong permissions.
 *
 * Cú pháp: ->middleware('perm.club:club,view')
 *           ->middleware('perm.club:member,view')
 */
class CheckClubPermission
{
    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$user) {
            throw new ApiException(__('exception.unauthorized'), 401);
        }

        // Superadmin bypass — không cần check club_id
        // Phải gọi method isSuperAdmin(), KHÔNG dùng $user->is_superadmin
        // (User model không có property/accessor đó → luôn NULL → bypass không bao giờ chạy)
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // 1. Ưu tiên lấy club_id từ route param {id}
        $clubId = $request->route('id') ?? $request->route('clubId');

        // 2. Nếu không có {id}, resolve từ {slug} hoặc {clubSlug}
        if (!$clubId) {
            $slug = $request->route('clubSlug')
                ?? $request->route('slug')
                ?? $request->input('clubSlug')
                ?? $request->input('club_slug');

            if ($slug) {
                $club = Club::whereHas('translations', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })->first();

                $clubId = $club?->id;
            }
        }

        // 3. Fallback: lấy từ request body (club_id)
        if (!$clubId) {
            $clubId = $request->input('club_id');
        }

        if (!$clubId) {
            throw new ApiException(__('exception.forbidden_action'), 403);
        }

        // Check CLUB SCOPE — truyền clubId vào hasPermission
        if (!$user->hasPermission($module, $action, (int) $clubId)) {
            throw new ApiException(__('exception.no_club_permission'), 403, 'NO_CLUB_PERMISSION');
        }

        return $next($request);
    }
}
