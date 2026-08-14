<?php

namespace Tests\Unit;

use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use App\Http\Middleware\CheckClubPermission;
use App\Services\Authorization\PermissionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CheckClubPermissionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('clubs', function (Blueprint $table): void {
            $table->id();
            $table->softDeletes();
        });

        Schema::create('club_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('club_id');
            $table->string('locale');
            $table->string('slug');
            $table->softDeletes();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('club_translations');
        Schema::dropIfExists('clubs');

        parent::tearDown();
    }

    public function test_it_resolves_only_the_club_and_leaves_resource_lookup_to_the_service(): void
    {
        $clubId = $this->createClub();

        $request = Request::create(
            '/api/v1/fund-periods/999/restore',
            'POST',
            ['club_slug' => 'club-vi'],
        );

        $route = new Route(
            ['POST'],
            'api/v1/fund-periods/{id}/restore',
            fn (): Response => new Response,
        );
        $route->bind($request);
        $request->setRouteResolver(fn (): Route => $route);

        $response = $this->middlewareWithPermission($clubId)->handle(
            $request,
            fn (): Response => new Response(status: 204),
            'fund_period',
            'update',
        );

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame($clubId, $request->attributes->get('club_id'));
        $this->assertSame('club-vi', $request->attributes->get('club_slug'));
        $this->assertSame('club-vi', $request->route('clubSlug'));
    }

    public function test_it_accepts_club_id_from_form_body(): void
    {
        $clubId = $this->createClub();
        $request = $this->requestWithRoute(
            '/api/v1/fund-periods',
            'POST',
            'api/v1/fund-periods',
            ['club_id' => $clubId],
        );

        $response = $this->middlewareWithPermission($clubId)->handle(
            $request,
            fn (): Response => new Response(status: 204),
            'fund_period',
            'create',
        );

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame($clubId, $request->attributes->get('club_id'));
        $this->assertSame('club-vi', $request->attributes->get('club_slug'));
    }

    public function test_it_accepts_club_slug_from_json_body(): void
    {
        $clubId = $this->createClub();
        $request = Request::create(
            '/api/v1/fund-periods',
            'POST',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['club_slug' => 'club-vi'], JSON_THROW_ON_ERROR),
        );
        $route = new Route(['POST'], 'api/v1/fund-periods', fn (): Response => new Response);
        $route->bind($request);
        $request->setRouteResolver(fn (): Route => $route);

        $response = $this->middlewareWithPermission($clubId)->handle(
            $request,
            fn (): Response => new Response(status: 204),
            'fund_period',
            'create',
        );

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame($clubId, $request->attributes->get('club_id'));
        $this->assertSame('club-vi', $request->attributes->get('club_slug'));
    }

    public function test_it_accepts_club_id_from_query_params(): void
    {
        $clubId = $this->createClub();
        $request = $this->requestWithRoute(
            "/api/v1/fund-periods?clubId={$clubId}",
            'GET',
            'api/v1/fund-periods',
        );

        $response = $this->middlewareWithPermission($clubId)->handle(
            $request,
            fn (): Response => new Response(status: 204),
            'fund_period',
            'view',
        );

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame($clubId, $request->attributes->get('club_id'));
    }

    public function test_it_accepts_club_slug_from_route_params(): void
    {
        $clubId = $this->createClub();
        $request = $this->requestWithRoute(
            '/api/v1/clubs/club-vi/fund-periods',
            'GET',
            'api/v1/clubs/{club_slug}/fund-periods',
        );

        $response = $this->middlewareWithPermission($clubId)->handle(
            $request,
            fn (): Response => new Response(status: 204),
            'fund_period',
            'view',
        );

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame('club-vi', $request->attributes->get('club_slug'));
    }

    public function test_it_accepts_matching_club_id_and_club_slug(): void
    {
        $clubId = $this->createClub();
        $request = $this->requestWithRoute(
            "/api/v1/fund-periods?club_id={$clubId}",
            'POST',
            'api/v1/fund-periods',
            ['club_slug' => 'club-vi'],
        );

        $response = $this->middlewareWithPermission($clubId)->handle(
            $request,
            fn (): Response => new Response(status: 204),
            'fund_period',
            'create',
        );

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame($clubId, $request->attributes->get('club_id'));
        $this->assertSame('club-vi', $request->attributes->get('club_slug'));
    }

    public function test_it_rejects_mismatched_club_id_and_club_slug(): void
    {
        $clubId = $this->createClub('club-one');
        $this->createClub('club-two');

        $request = $this->requestWithRoute(
            "/api/v1/fund-periods?club_id={$clubId}",
            'POST',
            'api/v1/fund-periods',
            ['club_slug' => 'club-two'],
        );

        try {
            $this->middlewareWithPermission($clubId, shouldCheckPermission: false)->handle(
                $request,
                fn (): Response => new Response(status: 204),
                'fund_period',
                'create',
            );

            $this->fail('Expected a club context mismatch exception.');
        } catch (ApiException $exception) {
            $this->assertSame(422, $exception->getStatus());
            $this->assertSame('CLUB_CONTEXT_MISMATCH', $exception->getErrorCode());
        }
    }

    private function createClub(string $slug = 'club-en'): int
    {
        $clubId = DB::table('clubs')->insertGetId(['deleted_at' => null]);

        DB::table('club_translations')->insert([
            ['club_id' => $clubId, 'locale' => 'en', 'slug' => $slug],
            ['club_id' => $clubId, 'locale' => 'vi', 'slug' => $slug === 'club-en' ? 'club-vi' : "{$slug}-vi"],
        ]);

        return $clubId;
    }

    /** @param array<string, mixed> $body */
    private function requestWithRoute(
        string $uri,
        string $method,
        string $routeUri,
        array $body = [],
    ): Request {
        $request = Request::create($uri, $method, $body);
        $route = new Route([$method], $routeUri, fn (): Response => new Response);
        $route->bind($request);
        $request->setRouteResolver(fn (): Route => $route);

        return $request;
    }

    private function middlewareWithPermission(
        int $clubId,
        bool $shouldCheckPermission = true,
    ): CheckClubPermission {
        $user = Mockery::mock(User::class)->makePartial();

        JWTAuth::shouldReceive('parseToken')->once()->andReturnSelf();
        JWTAuth::shouldReceive('authenticate')->once()->andReturn($user);

        $permissionService = Mockery::mock(PermissionService::class);

        if ($shouldCheckPermission) {
            $permissionService->shouldReceive('hasPermission')
                ->once()
                ->with($user, Mockery::type('string'), Mockery::type('string'), $clubId)
                ->andReturnTrue();
        } else {
            $permissionService->shouldNotReceive('hasPermission');
        }

        return new CheckClubPermission($permissionService);
    }
}
