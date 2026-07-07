<?php

namespace App\Http\Middleware;

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
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Lấy club_id từ route param hoặc request (nếu có)
        $clubId = $request->route('clubId') ?? $request->input('club_id');
        $clubId = $clubId ? (int) $clubId : null;

        if (!$user->hasPermission($module, $action, $clubId)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện hành động này.',
            ], 403);
        }

        return $next($request);
    }
}
