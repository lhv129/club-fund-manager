<?php

namespace App\Http\Middleware;

use App\Domains\Club\Models\Club;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use App\Services\Authorization\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

/** Resolve the club context, then check permission in that club. */
class CheckClubPermission
{
    public function __construct(
        private PermissionService $permissionService,
    ) {}

    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        /** @var User|null $user */
        $user = JWTAuth::parseToken()->authenticate();

        if (! $user) {
            throw new ApiException(__('exception.unauthorized'), 401);
        }

        [$clubId, $clubSlug] = $this->resolveClubIdentifiers($request, $module);
        $club = $this->resolveClub($clubId, $clubSlug);
        $clubId = (int) $club->id;
        $clubSlug = $clubSlug ?? $this->resolveCanonicalSlug($club);

        if (! $this->permissionService->hasPermission($user, $module, $action, $clubId)) {
            throw new ApiException(
                __('exception.no_club_permission'),
                403,
                'NO_CLUB_PERMISSION',
            );
        }

        $request->attributes->set('club', $club);
        $request->attributes->set('club_id', $clubId);
        $request->attributes->set('club_slug', $clubSlug);
        $request->merge(['club_id' => $clubId, 'club_slug' => $clubSlug]);

        // Backward-compatible controller/service arguments during route normalization.
        $this->prependClubSlugRouteParameter($request, $clubSlug);

        return $next($request);
    }

    /**
     * Resolve club_id and club_slug from route params, query params, or request body.
     *
     * @return array{0: int|null, 1: string|null}
     */
    private function resolveClubIdentifiers(Request $request, string $module): array
    {
        $clubIds = [
            $request->route('club_id'),
            $request->route('clubId'),
            $request->query('club_id'),
            $request->query('clubId'),
            $request->request->get('club_id'),
            $request->request->get('clubId'),
            $request->json('club_id'),
            $request->json('clubId'),
        ];

        $clubSlugs = [
            $request->route('club_slug'),
            $request->route('clubSlug'),
            $request->query('club_slug'),
            $request->query('clubSlug'),
            $request->request->get('club_slug'),
            $request->request->get('clubSlug'),
            $request->json('club_slug'),
            $request->json('clubSlug'),
        ];

        if ($module === 'club') {
            $clubIds[] = $request->route('id');
            $clubSlugs[] = $request->route('slug');
        }

        $clubId = $this->normalizeClubId($clubIds);
        $clubSlug = $this->normalizeClubSlug($clubSlugs);

        if ($clubId === null && $clubSlug === null) {
            throw new ApiException(
                __('exception.club_context_required'),
                422,
                'CLUB_CONTEXT_REQUIRED',
            );
        }

        return [$clubId, $clubSlug];
    }

    /** @param array<int, mixed> $values */
    private function normalizeClubId(array $values): ?int
    {
        $values = array_values(array_filter(
            $values,
            fn ($value) => $value !== null && $value !== '',
        ));

        if ($values === []) {
            return null;
        }

        foreach ($values as $value) {
            if (filter_var($value, FILTER_VALIDATE_INT) === false || (int) $value <= 0) {
                throw new ApiException(
                    __('exception.club_id_invalid'),
                    422,
                    'CLUB_ID_INVALID',
                );
            }
        }

        $clubIds = array_values(array_unique(array_map('intval', $values)));

        if (count($clubIds) > 1) {
            $this->throwClubContextMismatch();
        }

        return $clubIds[0];
    }

    /** @param array<int, mixed> $values */
    private function normalizeClubSlug(array $values): ?string
    {
        $clubSlugs = [];

        foreach ($values as $value) {
            if ($value === null || $value === '') {
                continue;
            }

            if (! is_string($value) || trim($value) === '') {
                $this->throwClubContextMismatch();
            }

            $clubSlugs[] = trim($value);
        }

        $clubSlugs = array_values(array_unique($clubSlugs));

        if (count($clubSlugs) > 1) {
            $this->throwClubContextMismatch();
        }

        return $clubSlugs[0] ?? null;
    }

    private function resolveClub(?int $clubId, ?string $clubSlug): Club
    {
        $query = Club::query()->with('translations');

        $club = $clubId !== null
            ? $query->find($clubId)
            : $query
                ->whereHas(
                    'translations',
                    fn ($translationQuery) => $translationQuery->where('slug', $clubSlug),
                )
                ->first();

        if (! $club) {
            throw new ApiException(__('domains/club.not_found'), 404, 'CLUB_NOT_FOUND');
        }

        if ($clubSlug !== null && ! $club->translations->contains('slug', $clubSlug)) {
            $this->throwClubContextMismatch();
        }

        return $club;
    }

    private function resolveCanonicalSlug(Club $club): string
    {
        $clubSlug = $club->translations
            ->firstWhere('locale', app()->getLocale())?->slug
            ?? $club->translations->first()?->slug;

        if (! is_string($clubSlug) || $clubSlug === '') {
            throw new ApiException(__('domains/club.not_found'), 404, 'CLUB_NOT_FOUND');
        }

        return $clubSlug;
    }

    private function throwClubContextMismatch(): never
    {
        throw new ApiException(
            __('exception.club_context_mismatch'),
            422,
            'CLUB_CONTEXT_MISMATCH',
        );
    }

    private function prependClubSlugRouteParameter(
        Request $request,
        string $slug
    ): void {
        $request->route()->setParameter('clubSlug', $slug);
    }
}
