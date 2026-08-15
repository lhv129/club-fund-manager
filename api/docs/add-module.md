# add-module.md

Checklist + template để thêm 1 module mới, tuân theo `api-overview.md`.
Ví dụ xuyên suốt: module **Category** — có translation + `sort_order` + `is_active`.

> Xem chi tiết convention filter/search/sort/pagination tại `api-overview.md` mục 13.

---

## Bước 0 — Xác định phạm vi

- Module có cần translation không? (bảng `{table}_translations`)
- Dùng `is_active` (boolean) hay `status` (string enum)?
- Có `sort_order` không?
- Permission group nào?

---

## Bước 1 — Migration

```php
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

## Bước 2 — Model

```php
// app/Domains/Category/Models/Category.php
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
// app/Domains/Category/Models/CategoryTranslation.php
class CategoryTranslation extends Model
{
    protected $fillable = ['category_id', 'locale', 'name', 'slug', 'description'];
}
```

---

## Bước 3 — Lang file (BẮT BUỘC trước khi viết Request)

```php
// lang/vi/domains/category.php
return [
    'attributes'     => ['name' => 'tên danh mục', 'description' => 'mô tả danh mục'],
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

```php
// lang/en/domains/category.php
return [
    'attributes'     => ['name' => 'category name', 'description' => 'category description'],
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

## Bước 4 — Request

### FilterCategoryRequest

**Cột `sort_by` bắt buộc có whitelist `in:...`** để chống cột lạ xuống Query Builder.

```php
class FilterCategoryRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }
}
```

### StoreCategoryRequest

```php
class StoreCategoryRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'logo'                       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active'                  => ['boolean'],
            'sort_order'                 => ['nullable', 'integer', 'min:0', 'max:999'],
            'translations'               => ['required', 'array', new RequiredLocales, new SupportedLocalesOnly, new UniqueTranslation('category_translations')],
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

### UpdateCategoryRequest

```php
class UpdateCategoryRequest extends BaseRequest
{
    public function rules(): array
    {
        $categoryId = (int) $this->route('id');

        return [
            'logo'                       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active'                  => ['sometimes', 'boolean'],
            'sort_order'                 => ['nullable', 'integer', 'min:0', 'max:999'],
            'translations'               => ['sometimes', 'array', 'min:1', new SupportedLocalesOnly, new UniqueTranslation('category_translations', $categoryId, 'category_id')],
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

---

## Bước 5 — Repository

**Nơi duy nhất build query.** `baseListQuery()` tách base query để tái dùng giữa `paginate()` / `cursorPaginate()` / `getForSelect()`. `applySearch()` / `applyFilters()` là `protected` per-domain.

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
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';
    protected array  $allowedSortColumns    = ['id', 'sort_order', 'created_at'];

    public function __construct(Category $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select(['id', 'logo', 'sort_order', 'is_active', 'created_at'])
            ->with('translations');
    }

    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $query->whereHas('translations', fn ($q) =>
                $q->where('name', 'like', "%{$filters['search']}%")
            );
        }
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
        // Thêm filter phức tạp (whereHas, join, withCount...) trực tiếp ở đây
    }

}
```

**Query phức tạp** (`join`, `withCount`, `whereHas` ngoài `applyFilters`) — viết thẳng trong method:

```php
public function paginate(array $filters = []): LengthAwarePaginator
{
    $query = $this->baseListQuery()
        ->join('club_members', 'club_members.club_id', '=', 'clubs.id')
        ->where('club_members.user_id', $filters['user_id'])
        ->withCount(['members as total_members' => fn ($q) => $q->where('status', 'approved')]);

    $this->applySearch($query, $filters);
    $this->applyFilters($query, $filters);
    $this->applySorting($query, $filters, $this->allowedSortColumns);

    return $query->paginate($filters['limit'] ?? $this->defaultLimit, ['*'], 'page', $filters['page'] ?? 1);
}
```

---

## Bước 6 — Service

**Không build query.** Chỉ truyền `$filters` xuống Repository. Thêm business logic (inject param, authorize, transaction) khi cần.

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

    public function __construct(CategoryRepository $repository)
    {
        parent::__construct($repository);
    }

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        // Inject business rule nếu cần, ví dụ:
        // $filters['owner_id'] = auth()->id();
        return $this->repository->paginate($filters); // hoặc getList
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
        $category     = $this->find($id);
        $translations = $data['translations'] ?? null;
        unset($data['translations']);

        if (isset($data['sort_order']) && $data['sort_order'] !== $category->sort_order) {
            $this->repository->applySortOrder((int) $data['sort_order'], $category->id, $category->sort_order);
        }

        return $this->repository->updateWithTranslations($category, $data, $translations ?? []);
    }
}
```

---

## Bước 7 — Resource

```php
class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'logo'         => $this->logo,
            'sort_order'   => $this->sort_order,
            'is_active'    => $this->is_active,
            'translations' => $this->whenLoaded('translations', fn () =>
                $this->translations->map(fn ($t) => [
                    'locale'      => $t->locale,
                    'name'        => $t->name,
                    'slug'        => $t->slug,
                    'description' => $t->description,
                ])
            ),
            'created_at'   => $this->created_at,
        ];
    }
}
```

---

## Bước 8 — Controller

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
    public function __construct(protected CategoryService $service) {}

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
            $this->service->cursorPaginate($request->only(['limit', 'search', 'is_active'])),
            __('domains/category.list')
        );
    }

    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/category.select'),
            $this->service->getForSelect($request->only(['search', 'is_active', 'limit']))
        );
    }

    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(true, __('domains/category.detail'), new CategoryResource($this->service->find($id)));
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        return $this->responseCommon(true, __('domains/category.created'), new CategoryResource($this->service->create($request->validated())), 201);
    }

    public function update(UpdateCategoryRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(true, __('domains/category.updated'), new CategoryResource($this->service->update($id, $request->validated())));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/category.deleted'));
    }

    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(true, __('domains/category.status_toggled'), new CategoryResource($this->service->toggleStatus($id)));
    }
}
```

---

## Bước 9 — Route

```php
// routes/api/v1/category.php
Route::middleware('auth.jwt')->prefix('categories')->group(function () {
    // Tĩnh trước — bắt buộc
    Route::get('/cursor',          [CategoryController::class, 'cursorIndex'])->middleware('perm.system:category,view');
    Route::get('/select',          [CategoryController::class, 'select'])->middleware('perm.system:category,view');
    Route::get('/slug/{slug}',     [CategoryController::class, 'showBySlug'])->middleware('perm.system:category,view');
    // Dynamic sau
    Route::get('/',                [CategoryController::class, 'index'])->middleware('perm.system:category,view');
    Route::get('/{id}',            [CategoryController::class, 'show'])->middleware('perm.system:category,view');
    Route::post('/',               [CategoryController::class, 'store'])->middleware('perm.system:category,create');
    Route::put('/{id}',            [CategoryController::class, 'update'])->middleware('perm.system:category,update');
    Route::delete('/{id}',         [CategoryController::class, 'destroy'])->middleware('perm.system:category,delete');
    Route::post('/{id}/toggle-status', [CategoryController::class, 'toggleStatus'])->middleware('perm.system:category,update');
});
```

---

## Bước 10 — Checklist trước khi merge

- [ ] Migration: bảng `{module}` + `{module}_translations` đúng schema
- [ ] Model: `$fillable`, `casts()`, relationship `translations()`
- [ ] Lang file `vi` + `en`: đủ `attributes` + tất cả message key
- [ ] **FilterRequest** có whitelist `sort_by` (`in:...`)
- [ ] Store/Update Request: `RequiredLocales` + `SupportedLocalesOnly` + `UniqueTranslation`, override `attributes()`
- [ ] **Repository** có `baseListQuery()`, `applySearch()`, `applyFilters()` là `protected`; `paginate()` / `cursorPaginate()` / `getForSelect()` build từ `baseListQuery()`
- [ ] **Service** không có `where`/`orderBy`/`select`/`with`/`join`; có `$notFoundMessage`; override `paginate()` + `cursorPaginate()`
- [ ] Controller: chỉ gọi Service + trả `responseCommon()` / `paginateResponse()` / `cursorResponse()`; không query DB
- [ ] Resource: `translations` qua `whenLoaded`
- [ ] Route: tĩnh trước `/{id}`, middleware `auth.jwt` + `perm.system:{module},{action}`
- [ ] Test `Accept-Language: vi` / `en` — attribute lỗi validate ra đúng label module
- [ ] Không có `DB::table` / `Model::where` trong Controller/Service
- [ ] PSR-12 + PHP 8.3
