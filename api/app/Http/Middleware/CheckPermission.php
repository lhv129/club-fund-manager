<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Middleware kiểm tra SYSTEM SCOPE permission.
 *
 * Dùng cho các route hệ thống (create/update/delete club, quản lý user, role, ...).
 * clubId luôn null → check flat module key (superadmin hoặc admin).
 *
 * Cú pháp: ->middleware('permission:club,create')
 */
class CheckPermission
{
    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$user) {
            throw new ApiException(__('exception.unauthorized'), 401);
        }

        // System scope — clubId luôn null, check flat permission key
        if (!$user->hasPermission($module, $action, null)) {
            throw new ApiException(__('exception.forbidden_action'), 403);
        }

        return $next($request);
    }
}
