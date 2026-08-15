<?php

use App\Exceptions\ApiException;
use App\Http\Middleware\CheckClubPermission;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\JwtAuthenticate;
use App\Http\Middleware\SetLocale;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        [
            'prefix' => 'api',
            'middleware' => ['api', 'auth.jwt'],
        ],
    )

    ->withMiddleware(function (Middleware $middleware): void {

        /*
        |--------------------------------------------------------------------------
        | GLOBAL API MIDDLEWARE
        |--------------------------------------------------------------------------
        */
        $middleware->api(prepend: [
            ForceJsonResponse::class,
            SetLocale::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | ROUTE MIDDLEWARE ALIAS
        |--------------------------------------------------------------------------
        */
        $middleware->alias([
            'auth.jwt' => JwtAuthenticate::class,
            'perm.system' => CheckPermission::class,
            'perm.club' => CheckClubPermission::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {

        /*
        |--------------------------------------------------------------------------
        | CUSTOM API EXCEPTION
        |--------------------------------------------------------------------------
        */
        $exceptions->render(function (ApiException $e, Request $request) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => $e->getErrorCode() ?: 'ERROR',
                'data' => $e->getData(),
            ], $e->getStatus());
        });

        /*
        |--------------------------------------------------------------------------
        | AUTHENTICATION EXCEPTION
        |--------------------------------------------------------------------------
        */
        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => __('exception.token_invalid'),
                    'data' => [],
                    'statusCode' => 401,
                ], 401);
            }
        });

        /*
        |--------------------------------------------------------------------------
        | FALLBACK EXCEPTION (OPTIONAL - KHUYÊN DÙNG)
        |--------------------------------------------------------------------------
        */
        $exceptions->renderable(function (Throwable $e, Request $request) {
            // Bỏ qua nếu đã có handler riêng xử lý
            if ($e instanceof ApiException) {
                return;
            }

            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => config('app.debug') ? $e->getMessage() : __('domains.exception.server_error'),
                    'data' => [],
                    'statusCode' => 500,
                ], 500);
            }
        });
    })

    ->create();
