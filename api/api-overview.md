# api-overview.md

Tài liệu tổng quan API — Laravel 12 / PHP 8.3. Đọc trước khi làm việc với bất kỳ module nào.

## 1. Tech Stack

- Framework: Laravel 12, PHP 8.3
- Auth: `tymon/jwt-auth` (JWT)
- DB: MySQL — đa ngôn ngữ qua bảng `{table}_translations`
- Kiến trúc: Domain-Driven Layered Architecture

## 2. Luồng xử lý bắt buộc

```
Request → Controller → Service → Repository → Model
```

| Layer | Trách nhiệm |
|---|---|
| Controller | Validate Request, gọi Service, trả response helper |
| Service | Business logic, authorization, transaction, orchestration — **KHÔNG build query** |
| Repository | Toàn bộ query DB: search / filter / sort / select / join / whereHas / with / paginate |
| Model | Schema, relationship, casts |

## 3. Base Classes (`app/Base/`)

| File | Vai trò |
|---|---|
| `BaseController.php` | Response helpers (`responseCommon`, `paginateResponse`, `cursorResponse`) |
| `BaseService.php` | Business logic, transaction |
| `BaseRepository.php` | Query Builder helpers |
| `BaseRequest.php` | FormRequest — auto response 422/403 |
| `Rules/RequiredLocales.php` | Translations phải đủ tất cả locale |
| `Rules/SupportedLocalesOnly.php` | Chặn locale lạ |
| `Rules/UniqueTranslation.php` | `name`/`title` unique theo locale |
| `Traits/HasTranslationSlug.php` | Tự sinh slug cho translation |


**Helper có sẵn trong `BaseRepository`:**

| Helper | Dùng cho |
|---|---|
| `applySorting($query, $filters, $allowedColumns)` | sort theo `sort_by` / `sort_dir` |
| `applyBooleanFilter($query, $filters, $key, $column?)` | boolean column |
| `applyActiveFilter($query, $filters, $column?)` | shortcut `is_active` |
| `applyStatusFilter($query, $filters, $key, $allowedStatuses, $column?)` | string status |
| `applyDateFilter($query, $filters, $key, $column?)` | khoảng ngày (`{key}_from` / `{key}_to`) |
| `getList($filters)` | Offset pagination chuẩn — **dùng cho code mới** |
| `getCursorList($filters)` | Cursor pagination chuẩn |
| `getForSelect($filters)` | Dropdown — không phân trang, không Resource |
| `paginate($where, ...)` | ~~Legacy~~ — giữ tương thích, không dùng mới |

Filter phức tạp (`whereHas`, `join`, `withCount`, `groupBy`) viết thẳng Query Builder trong Repository — không cần helper riêng.

## 4. Domain Structure

```
app/Domains/{Module}/
├── Controllers/
├── Requests/
├── Services/
├── Repositories/
├── Models/
└── Resources/
```

## 5. Response Format

```json
// Success
{ "success": true, "message": "...", "data": {} }

// Pagination (offset)
{ "success": true, "message": "...", "data": [], "meta": { "page": 1, "limit": 15, "total": 100, "last_page": 7 } }

// Pagination (cursor)
{ "meta": { "limit": 10, "has_more": true, "next_cursor": "eyJpZCI6MTAwfQ", "prev_cursor": null } }

// Business Error
{ "success": false, "message": "...", "code": "NOT_FOUND", "data": null }

// Validation Error (422)
{ "success": false, "message": "The given data was invalid.", "errors": { "translations.vi.name": ["..."] } }

// Auth Error (401)
{ "success": false, "message": "Access token has expired.", "statusCode": 401 }
```

## 6. HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

## 7. Middleware

| Alias | Nhiệm vụ |
|---|---|
| `ForceJsonResponse` (global) | Luôn trả JSON |
| `SetLocale` (global) | Đọc locale từ header `Accept-Language` |
| `auth.jwt` | Parse JWT, throw 401 khi lỗi token |
| `perm.system:module,action` | Check quyền theo module + action (club-scoped) |
| `LogApiRequest` | Log API request |
| `RateLimitByUser` | Rate limit theo user |

## 8. Đa ngôn ngữ

Bảng: `{table}_translations`, key `locale` là key của mảng.

```php
// Request rules
'translations' => ['required', 'array', new RequiredLocales, new SupportedLocalesOnly, new UniqueTranslation('club_translations')],
'translations.*'             => ['array'],
'translations.*.name'        => ['required', 'string', 'max:255'],
'translations.*.description' => ['nullable', 'string'],

// Request attributes — mỗi Request override, không dùng label chung
public function attributes(): array
{
    return $this->translationAttributes('club', ['name', 'description']);
}
```

Lang file: `lang/{locale}/domains/{module}.php`
```php
return [
    'attributes' => ['name' => 'tên câu lạc bộ', 'description' => 'mô tả câu lạc bộ'],
    'list' => '...', 'detail' => '...', 'created' => '...', 'updated' => '...', 'deleted' => '...', 'not_found' => '...',
];
```

Message trong Controller/Service luôn dùng `__('domains/{module}.{key}')`.

## 9. Permission

```php
->middleware('perm.system:club,view')
$user->isSuperAdmin();                           // bypass tất cả
$user->hasPermission('club', 'create', $clubId); // club-scoped
```

## 10. JWT Auth

- `JwtAuthenticate` parse token, throw `ApiException(401)` theo loại lỗi (expired / blacklisted / invalid / missing)
- Refresh token qua `UserRefreshToken` + `UserRefreshTokenRepository`

## 11. Route Convention

```
routes/api.php              → require toàn bộ v1
routes/api/v1/{module}.php  → route riêng từng module
```

**Thứ tự bắt buộc:** route tĩnh (`/cursor`, `/select`, `/slug/{slug}`) phải đứng trước `/{id}`.

## 12. Endpoint Pattern chuẩn

| Method | Path | Action | Permission |
|---|---|---|---|
| GET | `/{module}` | `index` | view |
| GET | `/{module}/cursor` | `cursorIndex` | view |
| GET | `/{module}/select` | `select` | view |
| GET | `/{module}/slug/{slug}` | `showBySlug` | view |
| GET | `/{module}/{id}` | `show` | view |
| POST | `/{module}` | `store` | create |
| PUT | `/{module}/{id}` | `update` | update |
| DELETE | `/{module}/{id}` | `destroy` | delete |
| POST | `/{module}/{id}/toggle-status` | `toggleStatus` | update |

Riêng module Transaction không có endpoint `POST`/`DELETE` công khai. Transaction chỉ được tạo hoặc
xóa nội bộ bởi nghiệp vụ sở hữu (webhook, MonthlyContribution, ExchangeSessionPlayer). API
`/transactions` chỉ cho xem và cập nhật `description`.

## 13. Filter / Search / Sort / Pagination

### Repository — nơi duy nhất build query

```php
// Query cơ sở — tách riêng để tái dùng giữa paginate / cursorPaginate / getForSelect
protected function baseListQuery(): Builder
{
    return $this->model
        ->select(['id', 'field_a', 'field_b', 'created_at'])
        ->with(['relation']);
}

public function getList(array $filters = []): LengthAwarePaginator // hoặc getList
{
    $query = $this->baseListQuery();

    // whereHas phức tạp viết thẳng ở đây trước khi gọi các helper
    if (!empty($filters['club_slug'])) {
        $query->whereHas('club.translations', fn ($q) => $q->where('slug', $filters['club_slug']));
    }

    $this->applySearch($query, $filters);          // protected — domain-specific
    $this->applyFilters($query, $filters);         // protected — dùng helper BaseRepository
    $this->applySorting($query, $filters, $this->allowedSortColumns);

    return $query->paginate($filters['limit'] ?? $this->defaultLimit, ['*'], 'page', $filters['page'] ?? 1);
}

// Search — protected, override per-domain
protected function applySearch(Builder $query, array $filters): void
{
    if (!empty($filters['search'])) {
        $query->where('fullname', 'like', "%{$filters['search']}%");
    }
}

// Filter — protected, compose helper BaseRepository
protected function applyFilters(Builder $query, array $filters): void
{
    $this->applyActiveFilter($query, $filters);
    // filter phức tạp thêm trực tiếp vào đây
}
```
**Trường hợp 1 — Chỉ override hooks (đơn giản nhất):**
Domain repo override `baseListQuery()` / `applySearch()` / `applyFilters()`.
Service gọi `$this->repository->getList($filters)` — BaseRepository xử lý phần còn lại.

**Trường hợp 2 — Tự viết method (khi có business rule cứng hoặc context param):**
[code example hiện tại với `baseListQuery()` + gọi tay từng hook]


### Service — chỉ truyền `$filters`, inject business rule nếu cần

```php
public function paginate(array $filters = []): LengthAwarePaginator
{
    $filters['owner_id'] = auth()->id(); // business rule — không phải query
    return $this->repository->paginate($filters);
}
```

Service **không** `where`, `orderBy`, `select`, `with`, `join`.

### Controller — validate rồi gọi Service

```php
public function index(FilterModuleRequest $request): JsonResponse
{
    return $this->paginateResponse(
        $this->service->paginate($request->validated()),
        __('domains/module.list')
    );
}
```

### Filter Request — sort_by phải có whitelist

```php
'sort_by'  => ['nullable', 'string', 'in:id,sort_order,created_at'],
'sort_dir' => ['nullable', 'string', 'in:asc,desc'],
```

## 14. AI Rules

- Đúng flow `Controller → Service → Repository → Model`, không bỏ layer.
- **Repository** là nơi duy nhất thao tác Query Builder. Dùng `baseListQuery()` để tách base query; `applySearch()` / `applyFilters()` là method `protected` per-domain; helper BaseRepository cho filter phổ thông; viết thẳng Query Builder cho filter phức tạp.
- **Service** không build query. Chỉ truyền `$filters` xuống Repository + inject business rule (authorize, transaction, param theo context). Bắt buộc có `protected string $notFoundMessage`.
- **Controller** không query DB, không business logic. Dùng FormRequest cho mọi endpoint có input (FilterRequest với whitelist `sort_by` cho index). Dùng `responseCommon()` / `paginateResponse()` / `cursorResponse()`.
- Lỗi nghiệp vụ throw `ApiException`. Transaction chỉ mở trong Service.
- Resource cho mọi endpoint trừ `/select`. Message luôn qua `__('domains/{module}.{key}')`.
- PHP 8.3 + PSR-12.
