<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenBlacklistedException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Facades\JWTAuth;


/**
 * -------------------------------------------------------------
 *  Base Laravel API
 *  Author : vietlh
 *  Email  : vietlh.hn@gmail.com
 *  Created: 2026
 *  License: Private / MIT
 * -------------------------------------------------------------
 */

class JwtAuthenticate
{
    public function handle(Request $request, Closure $next)
    {
        try {
            JWTAuth::parseToken()->authenticate();
        } catch (TokenExpiredException $e) {
            throw new ApiException(__('exception.token_expired'), 401);
        } catch (TokenBlacklistedException $e) {
            throw new ApiException(__('exception.token_blacklisted'), 401);
        } catch (TokenInvalidException $e) {
            throw new ApiException(__('exception.token_invalid'), 401);
        } catch (JWTException $e) {
            $message = match (true) {
                str_contains($e->getMessage(), 'not provided') => __('exception.token_not_provided'),
                str_contains($e->getMessage(), 'expired')      => __('exception.token_expired'),
                default                                        => __('exception.token_invalid'),
            };
            throw new ApiException($message, 401);
        } catch (\Exception $e) {
            throw new ApiException(__('exception.token_invalid_signature'), 401);
        }

        return $next($request);
    }
}
