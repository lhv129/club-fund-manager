# add-module.md

Checklist + template code để thêm 1 module (domain) mới, tuân theo `api-overview.md`.
Dùng file này làm quy trình chuẩn — copy template, đổi tên, điền logic.

Ví dụ dùng xuyên suốt: module **Category** — đơn giản, có translation + `sort_order` + `is_active`.

> Kiến trúc dữ liệu bắt buộc: `Controller → Service → Repository → Model`.
> **Service KHÔNG build query** (không `where`/`orderBy`/`select`/`with`/`join`).
> **Repository là nơi duy nhất** thao tác với Query Builder (filter/search/sort/paginate).
> Xem chi tiết ở `api-overview.md` mục *Filter / Search / Sort / Pagination*.

---

## Bước 0 — Xác định phạm vi

Trả lời trước khi code:

- Module có cần translation không? (bảng `{table}_translations`)
- Module có `sort_order` không?
- Module dùng `is_active` (boolean) hay `status` (string) để toggle?
- Module có cần permission riêng không, hay dùng chung nhóm nào?

---

## Bước 1 — Migration

```php
// database/migrations/xxxx_create_categories_table.php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('logo')->nullable();
    $table->unsignedInteger('sort_order')->default(0);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});

Schema::create('category_translations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('category_id')->constrained()->cascadeOnDelete();
    $table->string('locale', 5);
    $table->string('name');
    $table->string('slug');
    $table->text('description')->nullable();
    $table->timestamps();
    $table->unique(['category_id', 'locale']);
});
```

---

## Bước 2 — Model (`app/Domains/Category/Models/`)

```php
<?php

namespace App\Domains\Category\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['logo', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function translations()
    {
        return $this->hasMany(CategoryTranslation::class);
    }
}
```

```php
<?php

namespace App\Domains\Category\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryTranslation extends Model
{
    protected $fillable = ['category_id', 'locale', 'name', 'slug', 'description'];
}
```

---

## Bước 3 — Lang file (BẮT BUỘC trước khi viết Request)

`lang/vi/domains/category.php`

```php
<?php

return [
    'attributes' => [
        'name'        => 'tên danh mục',
        'description' => 'mô tả danh mục',
    ],
    'list'           => 'Lấy danh sách danh mục thành công.',
    'detail'         => 'Lấy chi tiết danh mục thành công.',
    'select'         => 'Lấy danh sách danh mục (dropdown) thành công.',
    'created'        => 'Tạo danh mục thành công.',
    'updated'        => 'Cập nhật danh mục thành công.',
    'deleted'        => 'Xoá danh mục thành công.',
    'status_toggled' => 'Cập nhật trạng thái danh mục thành công.',
    'not_found'      => 'Không tìm thấy danh mục.',
];
```

`lang/en/domains/category.php`

```php
<?php

return [
    'attributes' => [
        'name'        => 'category name',
        'description' => 'category description',
    ],
    'list'           => 'Categories retrieved successfully.',
    'detail'         => 'Category detail retrieved successfully.',
    'select'         => 'Categories (select) retrieved successfully.',
    'created'        => 'Category created successfully.',
    'updated'        => 'Category updated successfully.',
    'deleted'        => 'Category deleted successfully.',
    'status_toggled' => 'Category status updated successfully.',
    'not_found'      => 'Category not found.',
];
```

---

## Bước 4 — Request (`app/Domains/Category/Requests/`)

Mỗi endpoint có input đều phải có FormRequest (extends `BaseRequest`).

### Store

```php
<?php

namespace App\Domains\Category\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;

class StoreCategoryRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'logo'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active'  => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'translations' => [
                'required', 'array',
                new RequiredLocales,
                new SupportedLocalesOnly,
                new UniqueTranslation('category_translations'),
            ],
            'translations.*'             => ['array'],
            'translations.*.name'        => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
        ];
    }

    public function attributes(): array
    {
        return $this->translationAttributes('category', ['name', 'description']);
    }
}
```

### Update

```php
<?php

namespace App\Domains\Category\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;

class UpdateCategoryRequest extends BaseRequest
{
    public function rules(): array
    {
        $categoryId = (int) $this->route('id');

        return [
            'logo'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'translations' => [
                'sometimes', 'array', 'min:1',
                new SupportedLocalesOnly,
                new UniqueTranslation(
                    translationTable: 'category_translations',
                    excludeParentId: $categoryId,
                    fkColumn: 'category_id',
                ),
            ],
            'translations.*'             => ['array'],
            'translations.*.name'        => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
        ];
    }

    public function attributes(): array
    {
        return $this->translationAttributes('category', ['name', 'description']);
    }
}
```

### Filter (cho endpoint `index`)

Validate toàn bộ param filter/search/sort/paginate. **Cột `sort_by` phải có whitelist `in:...`**
để chống truyền cột lạ vào Query Builder.

```php
<?php

namespace App\Domains\Category\Requests;

use App\Base\BaseRequest;

class FilterCategoryRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'is_active'  => ['nullable', 'boolean'],
            'limit'      => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'       => ['nullable', 'integer', 'min:1'],
            'sort_by'    => ['nullable', 'string', 'in:id,sort_order,created_at'],
            'sort_dir'   => ['nullable', 'string', 'in:asc,desc'],
        ];
    }
}
```

---

## Bước 5 — Repository (`app/Domains/Category/Repositories/`)

**Đây là layer duy nhất build query.** Repository biết schema, relationship, translation,
vì vậy nó chịu trách nhiệm: search, filter, sort, select, join, whereHas, with, withCount, paginate.

Format bắt buộc cho **mọi** Repository:

```php
public function paginate(array $filters = [])
{
    $query = $this->model->select(...)->with(...);

    $this->applySearch($query, $filters);   // domain-specific
    $this->applyFilters($query, $filters);  // compose helper BaseRepository
    $this->applySorting($query, $filters, [...]); // helper BaseRepository

    return $query->paginate($filters['limit'] ?? $this->defaultLimit);
}
```

- `applySearch()` / `applyFilters()` là method **protected** riêng của từng Repository
  (cột search và filter khác nhau giữa các domain).
- `applySorting()` / `applyBooleanFilter()` / `applyActiveFilter()` / `applyStatusFilter()`
  / `applyDateFilter()` là **helper có sẵn trong `BaseRepository`** — thao tác trực tiếp lên
  Query Builder, không xây DSL thay thế Laravel.

```php
<?php

namespace App\Domains\Category\Repositories;

use App\Base\BaseRepository;
use App\Domains\Category\Models\Category;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Category $model)
    {
        parent::__construct($model);
    }

    /**
     * Danh sách category (offset pagination).
     * Toàn bộ filter/search/sort nằm ở đây — Service chỉ truyền $filters.
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->select(['id', 'logo', 'sort_order', 'is_active', 'created_at'])
            ->with('translations');

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters, ['id', 'sort_order', 'created_at']);

        return $query->paginate($filters['limit'] ?? $this->defaultLimit);
    }

    /**
     * Cursor pagination — chỉ dùng khi bảng lớn / UI infinite scroll.
     * Bắt buộc orderBy cột unique (id).
     */
    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        $query = $this->model
            ->select(['id', 'logo', 'sort_order', 'is_active'])
            ->with('translations');

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        $query->orderBy('id', 'desc');

        return $query->cursorPaginate($filters['limit'] ?? $this->defaultLimit);
    }

    /**
     * Dropdown — KHÔNG dùng Resource, trả Collection thường.
     */
    public function getForSelect(array $filters = []): Collection
    {
        $query = $this->model
            ->select(['id', 'sort_order'])
            ->with('translations');

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        $query->orderBy('sort_order', 'asc');

        return $query->limit(min((int) ($filters['limit'] ?? 20), 50))->get();
    }

    // -----------------------------------------------------------------
    // Domain-specific filter builders — compose helper của BaseRepository
    // -----------------------------------------------------------------

    /** Search theo name qua relationship translations. */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $query->whereHas('translations', function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%");
            });
        }
    }

    /** Filter theo các cột đơn giản — dùng helper BaseRepository. */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }
}
```

### Khi cần query phức tạp

Module nào cần `join`, `withCount`, `whereHas`, `groupBy` → viết trực tiếp trong Repository
như `ClubRepository::getAll()` / `ClubRepository::getByUser()` đang làm. **Không mở rộng DSL
`buildWhere()` để fake các method đó** — viết thẳng Query Builder của Laravel cho trực quan.

```php
// Ví dụ: cần join + withCount
$query = $this->model
    ->select(['clubs.id', 'clubs.logo', 'clubs.is_active'])
    ->join('club_members', 'club_members.club_id', '=', 'clubs.id')
    ->where('club_members.user_id', $userId)
    ->withCount(['members as total_members' => fn ($q) => $q->where('status', 'approved')]);
```

---

## Bước 6 — Service (`app/Domains/Category/Services/`)

**Service KHÔNG build query.** Service chỉ nhận `$filters` và truyền xuống Repository.
Service thêm business logic (authorize, transaction, orchestration giữa nhiều Repository) khi cần.

```php
<?php

namespace App\Domains\Category\Services;

use App\Base\BaseService;
use App\Domains\Category\Models\Category;
use App\Domains\Category\Repositories\CategoryRepository;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CategoryService extends BaseService
{
    protected string $notFoundMessage = 'domains/category.not_found';
    protected object $repository;

    public function __construct(CategoryRepository $repository)
    {
        parent::__construct($repository);
    }

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate($filters);
    }

    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->cursorPaginate($filters);
    }

    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    public function create(array $data): Category
    {
        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder((int) $data['sort_order']);
        }

        return $this->repository->createWithTranslations($data, $translations);
    }

    public function update(int $id, array $data): Category
    {
        $category = $this->find($id);

        $translations = $data['translations'] ?? null;
        unset($data['translations']);

        if (isset($data['sort_order']) && $data['sort_order'] !== $category->sort_order) {
            $this->repository->applySortOrder(
                (int) $data['sort_order'],
                $category->id,
                $category->sort_order,
            );
        }

        return $this->repository->updateWithTranslations($category, $data, $translations ?? []);
    }
}
```

### Service được thêm business logic

Ví dụ: gán `owner_id` theo user đăng nhập trước khi xuống Repository — đây là business rule,
không phải query.

```php
public function paginate(array $filters = []): LengthAwarePaginator
{
    $filters['owner_id'] = auth()->id(); // business rule

    return $this->repository->paginate($filters);
}
```

> **Không còn** `buildWhere()`, `buildOrderBy()`, `buildSearchWhere()` trong Service.
> Đây là chi tiết của tầng truy cập dữ liệu → chuyển hết về Repository.

---

## Bước 7 — Resource (`app/Domains/Category/Resources/`)

```php
<?php

namespace App\Domains\Category\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'logo'       => $this->logo,
            'sort_order' => $this->sort_order,
            'is_active'  => $this->is_active,
            'translations' => $this->whenLoaded('translations', fn () =>
                $this->translations->map(fn ($t) => [
                    'locale'      => $t->locale,
                    'name'        => $t->name,
                    'slug'        => $t->slug,
                    'description' => $t->description,
                ])
            ),
            'created_at' => $this->created_at,
        ];
    }
}
```

---

## Bước 8 — Controller (`app/Domains/Category/Controllers/`)

Controller: validate Request, gọi Service, trả response helper. **Không query DB, không business logic.**

```php
<?php

namespace App\Domains\Category\Controllers;

use App\Base\BaseController;
use App\Domains\Category\Requests\FilterCategoryRequest;
use App\Domains\Category\Requests\StoreCategoryRequest;
use App\Domains\Category\Requests\UpdateCategoryRequest;
use App\Domains\Category\Resources\CategoryResource;
use App\Domains\Category\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends BaseController
{
    protected object $service;

    public function __construct(CategoryService $service)
    {
        $this->service = $service;
    }

    public function index(FilterCategoryRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/category.list')
        );
    }

    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->all()),
            __('domains/category.list')
        );
    }

    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/category.select'),
            $this->service->getForSelect($request->all())
        );
    }

    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/category.detail'),
            new CategoryResource($this->service->find($id))
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/category.created'),
            new CategoryResource($this->service->create($request->validated())),
            201
        );
    }

    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/category.updated'),
            new CategoryResource($this->service->update($id, $request->validated()))
        );
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/category.deleted'));
    }

    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/category.status_toggled'),
            new CategoryResource($this->service->toggleStatus($id))
        );
    }
}
```

---

## Bước 9 — Route (`routes/api/v1/category.php`)

```php
<?php

use App\Domains\Category\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('categories')->group(function () {
    Route::get('/',                       [CategoryController::class, 'index'])->middleware('permission:category,view');
    Route::get('/cursor',                 [CategoryController::class, 'cursorIndex'])->middleware('permission:category,view');
    Route::get('/select',                 [CategoryController::class, 'select'])->middleware('permission:category,view');
    Route::get('/slug/{slug}',            [CategoryController::class, 'showBySlug'])->middleware('permission:category,view');
    Route::get('/{id}',                   [CategoryController::class, 'show'])->middleware('permission:category,view');
    Route::post('/',                      [CategoryController::class, 'store'])->middleware('permission:category,create');
    Route::put('/{id}',                   [CategoryController::class, 'update'])->middleware('permission:category,update');
    Route::delete('/{id}',                [CategoryController::class, 'destroy'])->middleware('permission:category,delete');
    Route::post('/{id}/toggle-status',    [CategoryController::class, 'toggleStatus'])->middleware('permission:category,update');
});
```

Nhớ require file này trong `routes/api.php` (hoặc trong nhóm v1 đã có sẵn).

> Thứ tự bắt buộc: các route tĩnh (`/cursor`, `/select`, `/slug/{slug}`) phải đứng trước `/{id}`
> để tránh bị route dynamic nuốt.

---

## Bước 10 — Checklist trước khi merge

- [ ] Migration tạo đúng bảng `{module}` + `{module}_translations`
- [ ] Model có `$fillable`, `casts()`, relationship `translations()`
- [ ] Lang file `lang/vi/domains/{module}.php` + `lang/en/domains/{module}.php` — đủ `attributes`
      + các key (`list`, `detail`, `select`, `created`, `updated`, `deleted`, `not_found`, ...)
- [ ] Request extends `BaseRequest`; Store/Update dùng `RequiredLocales` + `SupportedLocalesOnly`
      + `UniqueTranslation`, override `attributes()` qua `translationAttributes()`
- [ ] **Filter Request có whitelist `sort_by` (`in:...`)** để chống cột lạ xuống Query Builder
- [ ] **Repository là nơi duy nhất build query** — `paginate(array $filters = [])`, build thẳng
      trên Query Builder, dùng helper `BaseRepository` cho filter/sort phổ thông
- [ ] **Service KHÔNG có** `where`/`orderBy`/`select`/`with`/`join`/`buildWhere`/`buildOrderBy` —
      chỉ truyền `$filters` xuống Repository (+ business logic khi cần)
- [ ] Service extends `BaseService`, có `$notFoundMessage`, override `paginate()` + `cursorPaginate()`
- [ ] Controller extends `BaseController`, không query DB, không business logic, chỉ gọi Service
      + trả `responseCommon()` / `paginateResponse()` / `cursorResponse()`
- [ ] Resource trả `translations` qua `whenLoaded`
- [ ] Route đặt đúng thứ tự (`/select`, `/cursor`, `/slug/{slug}` trước `/{id}`), có middleware
      `auth.jwt` + `permission:{module},{action}`
- [ ] Test `Accept-Language: vi` và `Accept-Language: en` cho lỗi validate translations — attribute
      phải ra đúng label riêng của module, không phải chữ "name" chung chung
- [ ] Không có `DB::table`, `Model::where` trong Controller/Service
- [ ] PSR-12 + PHP 8.3 (typed properties, return types, constructor promotion khi phù hợp)

---

## Phụ lục A — Quy chuẩn Filter / Search / Sort / Pagination

Một cách duy nhất cho toàn bộ project.

### Format Repository chuẩn

```php
public function paginate(array $filters = [])
{
    $query = $this->model
        ->select([...])
        ->with([...]);          // eager load

    $this->applySearch($query, $filters);   // search — domain-specific
    $this->applyFilters($query, $filters);  // filter — compose helper
    $this->applySorting($query, $filters, [...]); // sort — helper BaseRepository

    return $query->paginate($filters['limit'] ?? $this->defaultLimit);
}
```

### Helper có sẵn trong `BaseRepository`

| Helper | Dùng cho | Đọc key |
|--------|----------|---------|
| `applySorting($query, $filters, $allowedColumns)` | sort | `sort_by`, `sort_dir` |
| `applyBooleanFilter($query, $filters, $key, $column?)` | boolean column | `$filters[$key]` |
| `applyActiveFilter($query, $filters, $column?)` | shortcut `is_active` | `is_active` |
| `applyStatusFilter($query, $filters, $key, $allowedStatuses, $column?)` | string status | `$filters[$key]` |
| `applyDateFilter($query, $filters, $key, $column?)` | khoảng ngày | `{key}_from`, `{key}_to` |

Quy ước:
- Helper bỏ qua key không tồn tại hoặc rỗng, nhưng **giữ giá trị falsy** (`0`, `false`, `'0'`)
  qua `array_key_exists` + `!== ''`.
- Cột sort / giá trị status phải có **whitelist** để chống SQL injection.
- Helper chỉ xử lý filter phổ thông; filter phức tạp (`whereHas`, `join`, `withCount`, `groupBy`)
  → viết trực tiếp trong Repository.

### Format Service chuẩn

```php
public function paginate(array $filters = [])
{
    return $this->repository->paginate($filters);
}
```

Service chỉ thêm business logic (authorize, transaction, inject param theo context).
**Không** `buildWhere` / `buildOrderBy` / `buildSearchWhere` / `select` / `with` / `join`.

---

## Phụ lục B — Migration từ DSL cũ

Code cũ dùng DSL trong Service:

```php
// KHÔNG dùng nữa
$where = $this->buildWhere($params, ['is_active']);
$where = array_merge($where, $this->buildSearchWhere($params, ['name']));

return $this->repository->paginate(
    where:   $where,
    orderBy: $this->buildOrderBy($params, ['id', 'sort_order', 'created_at']),
    select:  ['id', 'logo', 'sort_order', 'is_active', 'created_at'],
    with:    ['translations'],
    limit:   (int) ($params['limit'] ?? 15),
);
```

Chuyển sang:

1. **Repository** — viết `paginate(array $filters = [])` build thẳng Query Builder
   (xem Bước 5). Di chuyển `select` / `with` / `whereHas` / sort vào đây.
2. **Service** — thay bằng `return $this->repository->paginate($filters);`.
3. **Controller** — `index` dùng `FilterRequest` (validate `sort_by` whitelist),
   gọi `$this->service->paginate($request->validated())`.

Lý do bỏ DSL: Club cần `whereHas`, module khác cần `join` / `groupBy` / `withCount`.
Nếu tiếp tục mở rộng DSL (`buildWhere` + cú pháp `['field', 'whereIn', [...]]`...)
thì nó dần trở thành bản sao của Laravel Query Builder — tăng phức tạp mà không thêm lợi ích.
Viết thẳng Query Builder trong Repository thì rõ ràng và mở rộng tự do.
