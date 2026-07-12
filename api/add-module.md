add-module.md
Checklist + template code để thêm 1 module (domain) mới, tuân theo api-overview.md. Dùng file này làm quy trình chuẩn — copy template, đổi tên, điền logic.

Ví dụ dùng xuyên suốt: module Category (module đơn giản, có translation + sort_order + is_active).

Bước 0 — Xác định phạm vi
Trả lời trước khi code:

Module có cần translation không? (bảng {table}_translations)
Module có sort_order không?
Module dùng is_active (boolean) hay status (string) để toggle?
Module có cần permission riêng không, hay dùng chung nhóm nào?
Bước 1 — Migration
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

Bước 2 — Model (app/Domains/Category/Models/)
<?php
namespace App\Domains\Category\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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

<?php
namespace App\Domains\Category\Models;
use Illuminate\Database\Eloquent\Model;
class CategoryTranslation extends Model
{
    protected $fillable = ['category_id', 'locale', 'name', 'slug', 'description'];
}

Bước 3 — Lang file (BẮT BUỘC trước khi viết Request)
lang/vi/domains/category.php

<?php
return [
    'attributes' => [
        'name'        => 'tên danh mục',
        'description' => 'mô tả danh mục',
    ],
    'list'      => 'Lấy danh sách danh mục thành công.',
    'detail'    => 'Lấy chi tiết danh mục thành công.',
    'select'    => 'Lấy danh sách danh mục (dropdown) thành công.',
    'created'   => 'Tạo danh mục thành công.',
    'updated'   => 'Cập nhật danh mục thành công.',
    'deleted'   => 'Xoá danh mục thành công.',
    'status_toggled' => 'Cập nhật trạng thái danh mục thành công.',
    'not_found' => 'Không tìm thấy danh mục.',
];

lang/en/domains/category.php

<?php
return [
    'attributes' => [
        'name'        => 'category name',
        'description' => 'category description',
    ],
    'list'      => 'Categories retrieved successfully.',
    'detail'    => 'Category detail retrieved successfully.',
    'select'    => 'Categories (select) retrieved successfully.',
    'created'   => 'Category created successfully.',
    'updated'   => 'Category updated successfully.',
    'deleted'   => 'Category deleted successfully.',
    'status_toggled' => 'Category status updated successfully.',
    'not_found' => 'Category not found.',
];

Bước 4 — Request (app/Domains/Category/Requests/)
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
                'required',
                'array',
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
                'sometimes',
                'array',
                'min:1',
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

Bước 5 — Repository (app/Domains/Category/Repositories/)
<?php
namespace App\Domains\Category\Repositories;
use App\Base\BaseRepository;
use App\Domains\Category\Models\Category;
class CategoryRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';
    protected string $defaultOrderDirection = 'asc';
    public function __construct(Category $model)
    {
        parent::__construct($model);
    }
}

Bước 6 — Service (app/Domains/Category/Services/)
<?php
namespace App\Domains\Category\Services;
use App\Base\BaseService;
use App\Domains\Category\Repositories\CategoryRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\CursorPaginator;
class CategoryService extends BaseService
{
    protected string $notFoundMessage = 'domains/category.not_found';
    protected object $repository;
    public function __construct(CategoryRepository $repository)
    {
        parent::__construct($repository);
    }
    public function paginate(array $params = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            where:   $this->buildWhere($params, ['is_active']),
            orderBy: $this->buildOrderBy($params, ['id', 'sort_order', 'created_at']),
            select:  ['id', 'logo', 'sort_order', 'is_active', 'created_at'],
            with:    ['translations'],
            limit:   (int) ($params['limit'] ?? 15),
            page:    (int) ($params['page']  ?? 1),
        );
    }
    public function cursorPaginate(array $params = []): CursorPaginator
    {
        return $this->repository->cursorPaginate(
            where:   $this->buildWhere($params, ['is_active']),
            orderBy: ['id' => 'asc'],
            select:  ['id', 'logo', 'sort_order', 'is_active'],
            with:    ['translations'],
            limit:   (int) ($params['limit'] ?? 10),
        );
    }
    public function create(array $data): Category
    {
        $translations = $data['translations'] ?? [];
        unset($data['translations']);
        $data['sort_order'] = $data['sort_order'] ?? $this->repository->getNextSortOrder();
        return $this->repository->createWithTranslations($data, $translations);
    }
    public function update(int $id, array $data): Category
    {
        $category = $this->find($id);
        $translations = $data['translations'] ?? null;
        unset($data['translations']);
        if (isset($data['sort_order']) && $data['sort_order'] !== $category->sort_order) {
            $this->repository->applySortOrder($data['sort_order'], $category->id, $category->sort_order);
        }
        return $this->repository->updateWithTranslations($category, $data, $translations ?? []);
    }
    public function getForSelect(array $params = []): \Illuminate\Support\Collection
    {
        return $this->repository->get(
            where: $this->buildWhere($params, ['is_active']),
            orderBy: ['sort_order' => 'asc'],
            select: ['id', 'sort_order'],
            with: ['translations'],
            limit: min((int) ($params['limit'] ?? 20), 50),
        );
    }
}

Bước 7 — Resource (app/Domains/Category/Resources/)
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

Bước 8 — Controller (app/Domains/Category/Controllers/)
<?php
namespace App\Domains\Category\Controllers;
use App\Base\BaseController;
use App\Domains\Category\Requests\StoreCategoryRequest;
use App\Domains\Category\Requests\UpdateCategoryRequest;
use App\Domains\Category\Resources\CategoryResource;
use App\Domains\Category\Services\CategoryService;
use Illuminate\Http\Request;
class CategoryController extends BaseController
{
    protected object $service;
    public function __construct(CategoryService $service)
    {
        $this->service = $service;
    }
    public function index(Request $request)
    {
        return $this->paginateResponse(
            $this->service->paginate($request->all()),
            __('domains/category.list')
        );
    }
    public function cursorIndex(Request $request)
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->all()),
            __('domains/category.list')
        );
    }
    public function select(Request $request)
    {
        return $this->responseCommon(
            true,
            __('domains/category.select'),
            $this->service->getForSelect($request->all())
        );
    }
    public function show(int $id)
    {
        return $this->responseCommon(
            true,
            __('domains/category.detail'),
            new CategoryResource($this->service->find($id))
        );
    }
    public function store(StoreCategoryRequest $request)
    {
        return $this->responseCommon(
            true,
            __('domains/category.created'),
            new CategoryResource($this->service->create($request->validated())),
            201
        );
    }
    public function update(UpdateCategoryRequest $request, int $id)
    {
        return $this->responseCommon(
            true,
            __('domains/category.updated'),
            new CategoryResource($this->service->update($id, $request->validated()))
        );
    }
    public function destroy(int $id)
    {
        $this->service->deleteWithSortOrder($id);
        return $this->responseCommon(true, __('domains/category.deleted'));
    }
    public function toggleStatus(int $id)
    {
        return $this->responseCommon(
            true,
            __('domains/category.status_toggled'),
            new CategoryResource($this->service->toggleStatus($id))
        );
    }
}

Bước 9 — Route (routes/api/v1/category.php)
<?php
use App\Domains\Category\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;
Route::middleware('auth.jwt')->prefix('categories')->group(function () {
    Route::get('/',          [CategoryController::class, 'index'])->middleware('permission:category,view');
    Route::get('/cursor',    [CategoryController::class, 'cursorIndex'])->middleware('permission:category,view');
    Route::get('/select',    [CategoryController::class, 'select'])->middleware('permission:category,view');
    Route::get('/{id}',      [CategoryController::class, 'show'])->middleware('permission:category,view');
    Route::post('/',         [CategoryController::class, 'store'])->middleware('permission:category,create');
    Route::put('/{id}',      [CategoryController::class, 'update'])->middleware('permission:category,update');
    Route::delete('/{id}',   [CategoryController::class, 'destroy'])->middleware('permission:category,delete');
    Route::post('/{id}/toggle-status', [CategoryController::class, 'toggleStatus'])->middleware('permission:category,update');
});

Nhớ require file này trong routes/api.php (hoặc trong nhóm v1 đã có sẵn).

Bước 10 — Checklist trước khi merge
 Migration tạo đúng bảng {module} + {module}_translations
 Model có $fillable, casts(), relationship translations()
 Lang file lang/vi/domains/{module}.php + lang/en/domains/{module}.php — có đủ attributes + các key (list, detail, select, created, updated, deleted, not_found, ...)
 Request extends BaseRequest, dùng RequiredLocales + SupportedLocalesOnly + UniqueTranslation, override attributes() qua translationAttributes()
 Repository extends BaseRepository, không business logic
 Service extends BaseService, có notFoundMessage, override paginate() + cursorPaginate()
 Controller extends BaseController, không query DB, không business logic, chỉ gọi Service + trả response helper
 Resource trả translations qua whenLoaded
 Route đặt đúng thứ tự (/select, /cursor trước /{id}), có middleware auth.jwt + permission:{module},{action}
 Test thử Accept-Language: vi và Accept-Language: en cho lỗi validate translations — attribute phải ra đúng label riêng của module, không phải chữ "name" chung chung
 Không có DB::table, Model::where trong Controller/Service
 PSR-12 + PHP 8.3 (typed properties, return types, constructor promotion khi phù hợp)