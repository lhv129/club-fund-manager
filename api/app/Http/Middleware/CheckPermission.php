<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class CheckPermission
{
    /**
     * Dùng trên route: ->middleware('permission:club,view')
     * Hoặc club-scoped: ->middleware('permission:fund,create')
     * + club_id lấy từ route parameter {clubId} hoặc request body
     */
    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$user) {
            return throw new ApiException(__('exception.unauthorized'), 401);
        }

        // Lấy club_id từ route param hoặc request (nếu có)
        $clubId = $request->route('clubId') ?? $request->input('club_id');
        $clubId = $clubId ? (int) $clubId : null;

        if (!$user->hasPermission($module, $action, $clubId)) {
            return throw new ApiException(__('exception.forbidden_action'), 403);
        }

        return $next($request);
    }
}
