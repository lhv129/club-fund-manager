<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        $locale =
            $request->header('locale')
            ?? $request->header('Accept-Language')
            ?? config('app.locale');

        $supported = ['vi', 'en'];

        if (!in_array($locale, $supported)) {
            $locale = config('app.locale');
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
