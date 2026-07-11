# PROJECT_CONTEXT.md (Laravel 12 & PHP 8.3)

> **STRICT INSTRUCTION FOR AI**
>
> Đọc kỹ file này trước khi sinh code. **Tuyệt đối tuân thủ architecture, coding convention và domain structure.** Không tự ý bỏ qua layer, không viết code sai pattern.
> Mọi method signature, response format, naming trong file này **đã được đối chiếu với code thực tế** — sinh code phải khớp đúng.

---

# 1. Tech Stack & Architecture

## Tech Stack

- Framework: **Laravel 12**
- Language: **PHP 8.3**
- Auth: **tymon/jwt-auth** (JWT)
- DB: MySQL — hỗ trợ đa ngôn ngữ qua bảng `{table}_translations`

## Architecture

Project sử dụng **Domain-Driven Layered Architecture**.

Luồng xử lý bắt buộc:

```text
Request  →  Controller  →  Service  →  Repository  →  Model
```

Không được bỏ qua layer. Không được gọi ngắt (Controller → Repository, Service → Model).

## Base Classes

Tất cả module phải kế thừa các Base Class sau (nằm phẳng trong `app/Base/`, **không có subfolder**):

```text
app/Base/
├── BaseController.php   ← Controller extends
├── BaseService.php       ← Service extends
├── BaseRepository.php    ← Repository extends
├── BaseRequest.php       ← FormRequest extends
├── Rules/
│   ├── RequiredLocales.php       ← translations phải đủ locale
│   └── UniqueTranslation.php     ← name/title unique per locale
└── Traits/
    └── HasTranslationSlug.php     ← sinh slug cho translation
```

Không được tạo Controller/Service/Repository/Request độc lập nếu đã có Base tương ứng.

---

# 2. Folder Structure

## Domain Structure

Mỗi module nằm trong `app/Domains/{Module}/` với 5 layer con:

```text
app/
├── Base/                      # (xem mục 1)
│
├── Domains/
│   ├── Auth/                  # login, register, profile, refresh
│   │   ├── Controllers/       # AuthController, LoginController, RegisterController
│   │   ├── Requests/          # LoginRequest, RegisterRequest
│   │   ├── Services/          # AuthService, LoginService, RegisterService
│   │   └── Resources/         # ProfileResource
│   │
│   ├── User/
│   │   ├── Controllers/       # UserController
│   │   ├── Requests/          # StoreUserRequest, UpdateUserRequest
│   │   ├── Services/          # UserService, UserRefreshTokenService
│   │   ├── Repositories/      # UserRepository, UserRefreshTokenRepository
│   │   ├── Models/            # User, UserRefreshToken
│   │   └── Resources/         # UserResource, ProfileResource
│   │
│   ├── Club/                  # clubs + members + invites + translations
│   ├── Role/
│   ├── Permission/
│   ├── Module/
│   ├── Fund/
│   ├── Transaction/
│   ├── ExchangeSession/
│   ├── MonthlyContribution/
│   ├── MemberPaymentCode/
│   ├── BankAcount/
│   ├── Notification/
│   ├── Webhook/
│   └── Example/               # template/reference domain
│
├── Exceptions/
│   └── ApiException.php
│
├── Http/Middleware/
│   ├── ForceJsonResponse.php     # global — luôn trả JSON
│   ├── SetLocale.php             # global — đọc locale từ header
│   ├── JwtAuthenticate.php       # alias auth.jwt
│   ├── CheckPermission.php       # alias permission:module,action
│   ├── LogApiRequest.php
│   └── RateLimitByUser.php
│
└── Providers/
    └── AppServiceProvider.php
```

> **Lưu ý**: `Auth` domain không có `Repositories/` và `Models/` vì dùng `User` domain.
> Một domain **không bắt buộc** đủ 5 layer — chỉ tạo layer khi thực sự cần.

---

# 3. Layer Responsibilities

## 3.1 Request Layer

```php
class StoreClubRequest extends BaseRequest
```

### Responsibilities

- `rules()`: validate request data
- `authorize()`: kiểm tra quyền (mặc định `true` ở Base, override nếu cần)
- Dùng Custom Rules khi cần: `RequiredLocales`, `UniqueTranslation`

### Không được

- Validate trong Controller
- Gọi DB trong Request (trừ rule validation như `unique`, `exists`)

### Auto response khi fail

```json
// 422 Unprocessable Entity
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": { "field": ["..."] }
}
```

Đã được xử lý trong `BaseRequest::failedValidation()` + `failedAuthorization()`.

---

## 3.2 Controller Layer

```php
class ClubController extends BaseController
{
    protected object $service;

    public function __construct(ClubService $service)
    {
        $this->service = $service;
    }
}
```

### Responsibilities

- Nhận Request (FormRequest hoặc `Request`)
- Gọi Service
- Trả JSON Response qua helper của BaseController

### Response Helpers (từ BaseController)

```php
$this->responseCommon(bool $status, string $message = '', $data = null, int $httpCode = 200): JsonResponse
$this->paginateResponse($paginator, string $message = ''): JsonResponse
$this->cursorResponse(CursorPaginator $paginator, string $message = ''): JsonResponse
```

> **Quy ước**: `responseCommon` tham số đầu tiên là `bool $status`, không phải message.

### Response Message

Luôn dùng Translation — không hard-code:

```php
__('domains/club.created')
__('domains/club.updated')
__('domains/club.deleted')
__('domains/club.not_found')
```

### Không được

- Viết business logic
- Query database (`DB::table`, `Model::where`, Eloquent trực tiếp)
- Validate request trực tiếp (luôn dùng FormRequest)
- `return response()->json(...)` — phải dùng helper của BaseController

---

## 3.3 Service Layer

```php
class ClubService extends BaseService
{
    protected string $notFoundMessage = 'domains/club.not_found';
    protected object $repository;

    public function __construct(ClubRepository $repository)
    {
        parent::__construct($repository);
    }
}
```

### Responsibilities

- Toàn bộ Business Logic
- Quản lý Transaction (chỉ Service mới được)
- Gọi Repository — **không query Model trực tiếp**
- Throw `ApiException` khi có lỗi nghiệp vụ

### Convention bắt buộc

```php
protected string $notFoundMessage = 'domains/{module}/not_found';
```

`BaseService::find()` tự động throw `ApiException(404)` với message này khi không tìm thấy record.

### Phải override

`paginate()` và `cursorPaginate()` **throw `LogicException` ở Base** — domain Service bắt buộc override:

```php
public function paginate(array $params = []): LengthAwarePaginator
{
    return $this->repository->paginate(
        where:   $this->buildWhere($params, ['status']),
        orderBy: $this->buildOrderBy($params, ['id', 'title', 'created_at']),
        select:  ['id', 'title', 'created_at'],
        limit:   (int) ($params['limit'] ?? 0),
        page:    (int) ($params['page']  ?? 0),
    );
}
```

### Helpers từ BaseService

```php
$this->buildWhere($params, $filterKeys)         // equality filter, bỏ giá trị rỗng
$this->buildOrderBy($params, $allowedColumns)   // sort_by + sort_dir → ['col' => 'dir']
$this->buildSearchWhere($params, $columns)      // OR like search → ['orWhere' => [...]]
$this->findByConditions($conditions, $select, $with, $orFail)  // find + throw 404
$this->authorizeAction($ability, $model, $user) // Gate check, throw 403
```

### Có thể override

```php
find($id)         // thêm with/select
create($data)     // xử lý slug, sort_order, translations
update($id, $data)
delete($id)       // dùng deleteWithSortOrder() nếu có sort_order
toggleStatus($id) // is_active boolean HOẶC status string
```

### Transaction — chỉ Service

```php
DB::beginTransaction();
try {
    // ... gọi repository ...
    DB::commit();
} catch (\Throwable $e) {
    DB::rollBack();
    throw $e;
}
```

> `BaseRepository::createWithTranslations()` / `updateWithTranslations()` đã tự bọc `DB::transaction()` — không cần wrap lại.

### Không được

- Query DB trực tiếp (`Model::where`, `DB::table`)
- Trả JSON Response

---

## 3.4 Repository Layer

```php
class ClubRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Club $model)
    {
        parent::__construct($model);
    }
}
```

### Responsibilities

**Chỉ thao tác Database.** Dùng Eloquent / Query Builder.

### Public API từ BaseRepository (Service gọi các method này)

```php
// Read
all($orderBy, $select)
find($id, $columns)
findOrFail($id)
findBySlug($slug, $columns, $conditions)
findByTranslationSlug($slug, $columns, $conditions)
first($where, $orderBy, $select, $with)
firstOrCreate($where, $values)
get($where, $orderBy, $select, $with, $limit)
paginate($where, $orderBy, $select, $with, $limit, $page)
cursorPaginate($where, $orderBy, $select, $with, $limit)
getActive($select, $with)
pluck($column, $key)
pluckWhere($where, $column, $key, $limit)
count($where)
sum($field, $where)

// Write
create($data)
bulkInsert($data)
update(Model $model, $data)
editWhere($where, $data)
updateOrCreate($attributes, $values)
upsert($data, $uniqueBy, $updateColumns)
delete(Model $model)
deleteWhere($where)

// Numeric
increment($where, $column, $value)
decrement($where, $column, $value)

// Sort order
getNextSortOrder($column)
applySortOrder($newOrder, $id, $oldOrder)
decrementSortOrderAfterDelete($deletedOrder, $id)

// Translation (tự bọc transaction)
createWithTranslations($data, $translations)
updateWithTranslations($model, $data, $translations)
```

> `applyConditions()` và `applyOrderBy()` là **`protected`** — chỉ dùng nội bộ BaseRepository. Service **không gọi trực tiếp**; truyền `$where` / `$orderBy` vào `first()`, `get()`, `paginate()`...

### Format `$where` linh hoạt

```php
['field' => 'value']                         // where field = value
['field' => ['field', 'like', 'abc']]        // where field like %abc%
['field' => ['id', 'whereIn', [1,2,3]]]      // whereIn
['field' => ['created_at', 'whereBetween', [a,b]]]
['field' => ['email_verified_at', 'whereNotNull', null]]
['orWhere' => ['name' => 'val', 'email' => 'val']]   // OR group
['whereHas' => [['relation', ['field' => 'val']]]]    // whereHas relation
['whereRaw' => 'SQL string']
```

### Không được

- Business Logic
- Gọi Service
- Trả JSON Response

---

## 3.5 Model Layer

```php
class Club extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['logo', 'max_members', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    // Relationships
    public function translations() { return $this->hasMany(ClubTranslation::class); }
    public function members()       { return $this->hasMany(ClubMember::class); }

    // Helpers (entity-level, đơn giản)
    public function isActive(): bool { return $this->status === self::STATUS_ACTIVE; }
}
```

### Responsibilities

- `$fillable`, `$casts`, `$hidden`
- Relationships
- Helper entity đơn giản (`isActive()`, `isSuperAdmin()`, `isPendingVerification()`)

### Không được

- Business Logic phức tạp
- Query DB trong Model (trừ scope local: `scopeActive`)

---

# 4. Routing & Middleware

## Route Location

```text
routes/api.php              → require tất cả v1
routes/api/v1/{module}.php  → định nghĩa route module
```

Ví dụ `routes/api/v1/club.php`:

```php
Route::middleware('auth.jwt')->prefix('clubs')->group(function () {
    Route::get('/',          [ClubController::class, 'index'])->middleware('permission:club,view');
    Route::get('/cursor',    [ClubController::class, 'cursorIndex'])->middleware('permission:club,view');
    Route::get('/select',    [ClubController::class, 'select'])->middleware('permission:club,view');
    Route::get('/slug/{slug}', [ClubController::class, 'showBySlug'])->middleware('permission:club,view');
    Route::get('/{id}',      [ClubController::class, 'show'])->middleware('permission:club,view');

    Route::post('/',         [ClubController::class, 'store'])->middleware('permission:club,create');
    Route::put('/{id}',      [ClubController::class, 'update'])->middleware('permission:club,update');
    Route::delete('/{id}',   [ClubController::class, 'destroy'])->middleware('permission:club,delete');
    Route::post('/{id}/toggle-status', [ClubController::class, 'toggleStatus'])->middleware('permission:club,update');
});
```

> **Thứ tự route**: `/cursor`, `/select`, `/slug/{slug}` phải đứng **trước** `/{id}` để không bị nuốt.

## Middleware

| Alias / Vị trí | Middleware | Nhiệm vụ |
|---|---|---|
| Global API | `ForceJsonResponse` | Luôn trả JSON |
| Global API | `SetLocale` | Đọc locale từ header `locale` / `Accept-Language` |
| `auth.jwt` | `JwtAuthenticate` | Parse JWT, authenticate user, throw 401 nếu lỗi token |
| `permission:module,action` | `CheckPermission` | Check quyền user theo module + action (club-scoped) |
| Route | `LogApiRequest` | Log API request |
| Route | `RateLimitByUser` | Rate limit theo user |

---

# 5. Response Format & Error Handling

## Success Response

```json
{
  "success": true,
  "message": "Club created successfully.",
  "data": {}
}
```

Có `meta` khi pagination:

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 15,
    "total": 100,
    "last_page": 7
  }
}
```

Cursor pagination — `meta` khác:

```json
{
  "meta": {
    "limit": 10,
    "has_more": true,
    "next_cursor": "eyJpZCI6MTAwfQ",
    "prev_cursor": null
  }
}
```

## Error Response (ApiException)

```json
{
  "success": false,
  "message": "Club not found.",
  "code": "NOT_FOUND",
  "data": null
}
```

`code` là errorCode nội bộ — frontend dùng để xử lý logic.

## Validation Error (422)

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "translations.0.name": ["Name already taken for locale en."]
  }
}
```

## Authentication Error (401)

```json
{
  "success": false,
  "message": "Access token has expired.",
  "data": [],
  "statusCode": 401
}
```

## ApiException

Business Layer (Service) được phép throw:

```php
// Đơn giản
throw new ApiException(__('domains/club.not_found'), 404);
// → code tự sinh = 'NOT_FOUND'

// Có errorCode riêng
throw new ApiException('Tài khoản đã bị khoá', 403, 'ACCOUNT_LOCKED');

// Có data kèm theo
throw new ApiException('Validation thủ công', 422, 'VALIDATION_ERROR', ['field' => 'email']);
```

Framework tự format JSON tại `bootstrap/app.php`.

## Standard HTTP Status

| Code | Meaning | errorCode default |
|------|---------|---|
| 200 | OK | — |
| 201 | Created | — |
| 400 | Bad Request | `BAD_REQUEST` |
| 401 | Unauthorized | `UNAUTHORIZED` |
| 403 | Forbidden | `FORBIDDEN` |
| 404 | Not Found | `NOT_FOUND` |
| 422 | Validation Error | `VALIDATION_ERROR` |
| 429 | Too Many Requests | `TOO_MANY_REQUESTS` |
| 500 | Internal Server Error | `SERVER_ERROR` |

---

# 6. Cross-cutting Patterns

## 6.1 Translation (Đa ngôn ngữ)

Module có bản dịch dùng bảng `{table}_translations` (vd: `club_translations`).

**Request** — validate bằng Custom Rules:

```php
'translations' => ['required', 'array', new RequiredLocales, new UniqueTranslation('club_translations')],
'translations.*.locale' => ['required', 'string', Rule::in(config('app.supported_locales'))],
'translations.*.name'    => ['required', 'string', 'max:255'],
```

- `RequiredLocales` → phải đủ `config('app.supported_locales')` (vd: `['vi', 'en']`)
- `UniqueTranslation` → name/title unique per locale
- Update: `new UniqueTranslation('club_translations', excludeParentId: $id, fkColumn: 'club_id')`

**Service** — tách `translations` khỏi `$data`, gọi Repository:

```php
$translations = $data['translations'] ?? [];
unset($data['translations']);
return $this->repository->createWithTranslations($data, $translations);
```

**Slug** tự sinh qua `HasTranslationSlug` trait (ưu tiên `slug` → `name` → `title`).

**Resource** — trả translations qua `whenLoaded`:

```php
'translations' => $this->whenLoaded('translations', fn () =>
    $this->translations->map(fn ($t) => [
        'locale' => $t->locale,
        'name' => $t->name,
        'slug' => $t->slug,
    ])
),
```

## 6.2 Sort Order

Module có `sort_order` dùng helper của BaseRepository:

```php
// Create — tự sinh nếu thiếu
$data['sort_order'] = $this->repository->getNextSortOrder();
// hoặc dời các record khác
$this->repository->applySortOrder($data['sort_order']);

// Update — dời nếu thay đổi
if ($data['sort_order'] !== $club->sort_order) {
    $this->repository->applySortOrder($data['sort_order'], $club->id, $club->sort_order);
}

// Delete — dùng deleteWithSortOrder() của BaseService
$this->deleteWithSortOrder($id);
```

Reorder (kéo thả) — Service bọc transaction:

```php
DB::beginTransaction();
try {
    foreach ($data as $item) {
        $this->repository->editWhere(['id' => $item['id']], ['sort_order' => $item['sort_order']]);
    }
    DB::commit();
} catch (\Throwable $e) { DB::rollBack(); throw $e; }
```

## 6.3 Toggle Status

2 pattern tùy Model:

- **`is_active` boolean** → `BaseService::toggleStatus()` dùng được luôn
- **`status` string** (vd: `active`/`locked`) → Service **override** `toggleStatus()`

```php
// User — status string
public function toggleStatus(int $id): User
{
    $user = $this->find($id);
    $user->status = $user->status === 'active' ? 'locked' : 'active';
    $user->save();
    return $user->fresh();
}
```

Route: `POST /{id}/toggle-status` (hoặc `PATCH`).

## 6.4 Select Endpoint (Dropdown)

Controller endpoint `/select` → Service `getForSelect()`:

```php
// Service
public function getForSelect(array $params = []): Collection
{
    return $this->repository->get(
        where: $this->buildWhere($params, ['is_active']),
        orderBy: ['id' => 'asc'],
        select: ['id', 'fullname'],
        limit: min((int) ($params['limit'] ?? 20), 50),
    );
}
```

Trả collection qua `responseCommon()` — **không cần Resource** (chỉ id + label).

## 6.5 Permission (Club-scoped)

```php
// Middleware
->middleware('permission:club,view')

// Model User
$user->isSuperAdmin();                          // bypass tất cả
$user->hasPermission('club', 'create', $clubId); // check club-scoped
$user->permissionsGroupedByClub();              // { club_id: { module: [actions] } }
```

Service có thể dùng Gate qua `authorizeAction()`.

## 6.6 JWT Auth

- `JwtAuthenticate` middleware parse token, throw `ApiException(401)` theo loại lỗi (expired, blacklisted, invalid, not provided)
- Refresh token qua `UserRefreshToken` model + `UserRefreshTokenRepository`
- `User` implements `JWTSubject`

---

# 7. Naming Convention

| Layer | Pattern | Ví dụ |
|---|---|---|
| Controller | `{Module}Controller` | `ClubController`, `ClubInviteController` |
| Controller (sub-entity) | `{Module}{Sub}Controller` | `ClubMemberController` |
| Request (create) | `Store{Module}Request` | `StoreClubRequest` |
| Request (update) | `Update{Module}Request` | `UpdateClubRequest` |
| Request (list/filter) | `Filter{Module}Request` | `FilterClubRequest` |
| Request (action cụ thể) | `{Action}{Module}Request` | `JoinClubRequest`, `RejectMemberRequest` |
| Service | `{Module}Service` | `ClubService` |
| Repository | `{Module}Repository` | `ClubRepository` |
| Model | `{Module}` (singular) | `Club`, `ClubMember` |
| Model (translation) | `{Module}Translation` | `ClubTranslation` |
| Resource | `{Module}Resource` | `ClubResource`, `ProfileResource` |
| Migration | `{create|update}_{table}_table` | `create_clubs_table` |
| Lang file | `lang/{locale}/domains/{module}.php` | `lang/en/domains/club.php` |

Lang key convention (trong `domains/{module}.php`):

```php
'list', 'detail', 'select', 'created', 'updated', 'deleted',
'status_toggled', 'not_found', 'owner_updated'
```

---

# 8. AI Rules (Strict Constraints)

Khi AI sinh code, **BẮT BUỘC** tuân thủ toàn bộ quy tắc sau.

1. **Follow architecture** — luôn đi đúng flow Request → Controller → Service → Repository → Model. Không bỏ qua layer.
2. **Domain structure** — tạo file đúng `app/Domains/{Module}/{Layer}/`.
3. **Repository only database** — không query DB trong Controller/Service. Mọi thao tác DB qua `BaseRepository` / `{Module}Repository`.
4. **Repository không business logic** — chỉ query, filter, join, pagination, CRUD.
5. **Luôn tạo Form Request** nếu API có validate — `StoreSomethingRequest extends BaseRequest`. Không validate trong Controller.
6. **Luôn dùng API Resource** trả dữ liệu — `new UserResource($user)` / `UserResource::collection($users)`. Không trả Model trực tiếp (trừ endpoint `/select` trả collection thô).
7. **Luôn dùng BaseController response** — `responseCommon()` / `paginateResponse()` / `cursorResponse()`. Không `return response()->json(...)`.
8. **Translation** — message response luôn `__('domains/{module}.{key}')`. Không hard-code.
9. **`notFoundMessage`** — Service bắt buộc khai báo `protected string $notFoundMessage = 'domains/{module}/not_found'`.
10. **Override `paginate()` / `cursorPaginate()`** — Base throw `LogicException` nếu không override.
11. **Transaction chỉ trong Service** — `DB::beginTransaction/commit/rollBack()`. Không trong Controller/Repository (trừ `DB::transaction()` đã wrap sẵn trong translation helpers).
12. **ApiException** — Service throw `ApiException` cho lỗi nghiệp vụ. Controller chỉ trả response.
13. **PHP 8.3** — Constructor Property Promotion, Readonly, Typed Properties, Return Types, Match, Null-safe, Union Types khi phù hợp. PSR-12, SOLID.

---

# 9. Ví dụ luồng tạo Club

```text
POST /api/v1/clubs
    ↓
StoreClubRequest          → validate (translations, RequiredLocales, UniqueTranslation)
    ↓
ClubController@store      → $this->service->create($request->validated())
    ↓                         → responseCommon(true, __('domains/club.created'), new ClubResource($club), 201)
ClubService::create       → tách translations, sinh sort_order, gọi repository
    ↓
ClubRepository::createWithTranslations  → DB::transaction: create club + createMany translations + load
    ↓
Club + ClubTranslation    → Eloquent
    ↓
ClubResource              → format JSON response
```

---

# 10. Code Generation Checklist

Trước khi sinh code, AI phải tự kiểm tra:

- [ ] Đúng Domain Structure (`app/Domains/{Module}/`)
- [ ] Đúng 5 layer (hoặc chỉ tạo layer cần thiết)
- [ ] Controller extends `BaseController` — không business, không query DB
- [ ] Service extends `BaseService` — có `notFoundMessage`, override `paginate()`/`cursorPaginate()`
- [ ] Repository extends `BaseRepository` — chỉ thao tác DB, gọi public API của Base
- [ ] Request extends `BaseRequest` — có `rules()`
- [ ] Có API Resource (trừ endpoint `/select`)
- [ ] Có Translation key trong `lang/{locale}/domains/{module}.php`
- [ ] Kế thừa đúng Base Classes
- [ ] Dùng Response Helpers (`responseCommon` / `paginateResponse` / `cursorResponse`)
- [ ] `responseCommon` — nhớ param đầu là `bool $status`
- [ ] Error dùng `ApiException`, không `return response()->json` lỗi
- [ ] Tuân thủ PHP 8.3 + PSR-12
- [ ] Tuân thủ Naming Convention (mục 7)
