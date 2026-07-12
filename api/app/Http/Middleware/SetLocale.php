<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;


class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language');
        $supported = config('app.supported_locales', [config('app.locale')]);
        if ($locale && in_array($locale, $supported, true)) {
            app()->setLocale($locale);
        }
        return $next($request);
    }
}
