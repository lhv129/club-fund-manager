<?php

namespace App\Http\Middleware;

use App\Domains\Bank\Models\BankAccount;
use App\Domains\Club\Models\Club;
use App\Domains\Club\Models\ClubInvite;
use App\Domains\Club\Models\ClubMember;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\PlayingSchedule\Models\PlayingSchedule;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use App\Exceptions\ApiException;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

/** Resolve the request scope, then check the permission in that exact scope. */
class CheckClubPermission
{
    private const RESOURCE_MODELS = [
        'bank_account' => BankAccount::class,
        'club_invite' => ClubInvite::class,
        'club_member' => ClubMember::class,
        'exchange_session' => ExchangeSession::class,
        'fund_period' => FundPeriod::class,
        'member_payment_code' => MemberPaymentCode::class,
        'monthly_contribution' => MonthlyContribution::class,
        'playing_schedule' => PlayingSchedule::class,
        'transaction' => Transaction::class,
        'webhook_config' => WebhookConfig::class,
    ];

    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $user) {
            throw new ApiException(__('exception.unauthorized'), 401);
        }

        $club = $this->resolveClub($request, $module);
        $clubId = $club?->id;

        // Write operations on club-owned resources must always name a club.
        if (! $request->isMethod('GET') && $clubId === null) {
            throw new ApiException(__('exception.forbidden_action'), 403);
        }

        if (! $user->hasPermission($module, $action, $clubId)) {
            throw new ApiException(
                $clubId === null ? __('exception.forbidden_action') : __('exception.no_club_permission'),
                403,
                $clubId === null ? '' : 'NO_CLUB_PERMISSION',
            );
        }

        if ($club) {
            $slug = $club->translations->first()?->slug;
            $request->attributes->set('club', $club);
            $request->attributes->set('club_id', $club->id);
            $request->attributes->set('club_slug', $slug);
            $request->merge(['club_id' => $club->id, 'club_slug' => $slug]);

            // Backward-compatible controller/service arguments during route normalization.
            $this->prependClubSlugRouteParameter($request, $slug);
        }

        return $next($request);
    }

    private function resolveClub(Request $request, string $module): ?Club
    {
        if ($module === 'club') {
            if ($request->route('id')) {
                return $this->findClub((int) $request->route('id'));
            }

            if ($slug = $request->route('slug')) {
                $request->merge(['club_slug' => $slug]);
            }
        }

        if ($resource = $this->resolveResource($request, $module)) {
            return $this->findClub((int) $resource->club_id);
        }

        // Sub-resources inherit scope from their parent resource.
        if ($request->route('sessionId')) {
            $session = ExchangeSession::query()->find($request->route('sessionId'));
            return $session ? $this->findClub((int) $session->club_id) : null;
        }

        if ($request->route('contributionId')) {
            $contribution = MonthlyContribution::query()->find($request->route('contributionId'));
            return $contribution ? $this->findClub((int) $contribution->club_id) : null;
        }

        $clubId = $request->input('club_id');
        $clubSlug = $request->input('club_slug') ?? $request->input('clubSlug');

        if ($clubId && $clubSlug) {
            $club = $this->findClub((int) $clubId);
            if (! $club->translations->contains('slug', $clubSlug)) {
                throw new ApiException(__('domains/club.not_found'), 404, 'CLUB_NOT_FOUND');
            }
            return $club;
        }

        if ($clubId) {
            return $this->findClub((int) $clubId);
        }

        if ($clubSlug) {
            $club = Club::query()
                ->with('translations')
                ->whereHas('translations', fn ($query) => $query->where('slug', $clubSlug))
                ->first();

            if (! $club) {
                throw new ApiException(__('domains/club.not_found'), 404, 'CLUB_NOT_FOUND');
            }

            return $club;
        }

        return null;
    }

    private function resolveResource(Request $request, string $module): ?Model
    {
        $model = self::RESOURCE_MODELS[$module] ?? null;
        $id = $request->route('memberId') ?? $request->route('id');

        if (! $model || ! $id) {
            return null;
        }

        $resource = $model::query()->find($id);
        if (! $resource) {
            throw new ApiException(__('exception.not_found'), 404);
        }

        return $resource;
    }

    private function findClub(int $clubId): Club
    {
        $club = Club::query()->with('translations')->find($clubId);

        if (! $club) {
            throw new ApiException(__('domains/club.not_found'), 404, 'CLUB_NOT_FOUND');
        }

        return $club;
    }

    private function prependClubSlugRouteParameter(Request $request, string $slug): void
    {
        $route = $request->route();
        $parameters = $route->parameters();

        foreach (array_keys($parameters) as $key) {
            $route->forgetParameter($key);
        }

        $route->setParameter('clubSlug', $slug);

        foreach ($parameters as $key => $value) {
            $route->setParameter($key, $value);
        }
    }
}
