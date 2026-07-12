api-overview.md
Tài liệu tổng quan API — Laravel 12 / PHP 8.3. Đọc file này để hiểu convention chung trước khi làm việc với bất kỳ module nào.

1. Tech Stack
Framework: Laravel 12, PHP 8.3
Auth: tymon/jwt-auth (JWT)
DB: MySQL — đa ngôn ngữ qua bảng {table}_translations
Kiến trúc: Domain-Driven Layered Architecture
2. Luồng xử lý bắt buộc
Request  →  Controller  →  Service  →  Repository  →  Model

Không được bỏ layer, không được gọi tắt (Controller → Repository, Service → Model trực tiếp).

3. Base Classes (app/Base/)
File	Vai trò
BaseController.php	Controller extends — cung cấp response helpers
BaseService.php	Service extends — business logic, transaction
BaseRepository.php	Repository extends — thao tác DB
BaseRequest.php	FormRequest extends — validate + auto response 422/403
Rules/RequiredLocales.php	Bắt buộc translations phải đủ tất cả locale trong config('app.supported_locales')
Rules/SupportedLocalesOnly.php	Chặn locale lạ không có trong config (chiều ngược lại của RequiredLocales)
Rules/UniqueTranslation.php	name/title unique theo từng locale
Traits/HasTranslationSlug.php	Tự sinh slug cho translation
4. Domain Structure
Mỗi module nằm ở app/Domains/{Module}/, có tối đa 5 layer con — chỉ tạo layer thực sự cần:

app/Domains/{Module}/
├── Controllers/
├── Requests/
├── Services/
├── Repositories/
├── Models/
└── Resources/

5. Response Format
Success
{
  "success": true,
  "message": "Club created successfully.",
  "data": {}
}

Success + Pagination (offset)
{
  "success": true,
  "message": "...",
  "data": [],
  "meta": { "page": 1, "limit": 15, "total": 100, "last_page": 7 }
}

Success + Pagination (cursor)
{
  "meta": { "limit": 10, "has_more": true, "next_cursor": "eyJpZCI6MTAwfQ", "prev_cursor": null }
}

Business Error (ApiException)
{
  "success": false,
  "message": "Club not found.",
  "code": "NOT_FOUND",
  "data": null
}

Validation Error (422)
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "translations.vi.name": ["Trường tên câu lạc bộ là bắt buộc."]
  }
}

Xử lý tự động trong BaseRequest::failedValidation() / failedAuthorization().

Auth Error (401)
{
  "success": false,
  "message": "Access token has expired.",
  "data": [],
  "statusCode": 401
}

6. Standard HTTP Status
Code	Meaning	errorCode default
200	OK	—
201	Created	—
400	Bad Request	BAD_REQUEST
401	Unauthorized	UNAUTHORIZED
403	Forbidden	FORBIDDEN
404	Not Found	NOT_FOUND
422	Validation Error	VALIDATION_ERROR
429	Too Many Requests	TOO_MANY_REQUESTS
500	Internal Server Error	SERVER_ERROR
7. Middleware
Alias / Vị trí	Middleware	Nhiệm vụ
Global API	ForceJsonResponse	Luôn trả JSON
Global API	SetLocale	Đọc locale từ header Accept-Language (fallback config('app.locale') nếu không hợp lệ)
auth.jwt	JwtAuthenticate	Parse JWT, throw 401 khi lỗi token
permission:module,action	CheckPermission	Check quyền theo module + action (club-scoped)
Route	LogApiRequest	Log API request
Route	RateLimitByUser	Rate limit theo user
8. Đa ngôn ngữ (Translation)
Bảng dữ liệu: {table}_translations (vd club_translations), key locale nằm ở key của mảng, không phải field locale bên trong từng item.
Validate:
'translations' => [
    'required', 'array',
    new RequiredLocales,
    new SupportedLocalesOnly,
    new UniqueTranslation('club_translations'),
],
'translations.*'             => ['array'],
'translations.*.name'        => ['required', 'string', 'max:255'],
'translations.*.description' => ['nullable', 'string'],

Attribute label cho lỗi validate (không hard-code, không dùng chung "name" cho mọi domain) — mỗi Request override:
public function attributes(): array
{
    return $this->translationAttributes('club', ['name', 'description']);
}

BaseRequest::translationAttributes() build key domains/{module}.attributes.{field} và resolve theo locale hiện tại (do SetLocale set từ header Accept-Language).
Lang file bắt buộc đặt tại lang/{locale}/domains/{module}.php, có cấu trúc:
return [
    'attributes' => [
        'name'        => 'tên câu lạc bộ',
        'description' => 'mô tả câu lạc bộ',
    ],
    'list' => '...', 'detail' => '...', 'created' => '...',
    'updated' => '...', 'deleted' => '...', 'not_found' => '...',
];

Response message trong Controller/Service luôn dùng __('domains/{module}.{key}'), không hard-code string.
9. Permission (club-scoped)
->middleware('permission:club,view')
$user->isSuperAdmin();                          // bypass tất cả
$user->hasPermission('club', 'create', $clubId); // check club-scoped
$user->permissionsGroupedByClub();               // { club_id: { module: [actions] } }

10. JWT Auth
JwtAuthenticate parse token, throw ApiException(401) theo loại lỗi (expired / blacklisted / invalid / missing)
Refresh token qua UserRefreshToken + UserRefreshTokenRepository
User implements JWTSubject
11. Route Convention
routes/api.php              → require toàn bộ v1
routes/api/v1/{module}.php  → route riêng từng module

Thứ tự bắt buộc: các route tĩnh (/cursor, /select, /slug/{slug}) phải đứng trước /{id} để tránh bị route dynamic nuốt.

12. Endpoint Pattern chuẩn cho 1 module
Method	Path	Action	Permission
GET	/{module}	index (offset pagination)	view
GET	/{module}/cursor	cursorIndex	view
GET	/{module}/select	select (dropdown, không Resource)	view
GET	/{module}/slug/{slug}	showBySlug	view
GET	/{module}/{id}	show	view
POST	/{module}	store	create
PUT	/{module}/{id}	update	update
DELETE	/{module}/{id}	destroy	delete
POST	/{module}/{id}/toggle-status	toggleStatus	update
13. AI Rules (bắt buộc khi sinh code)
Đúng flow Request → Controller → Service → Repository → Model, không bỏ layer.
File đặt đúng app/Domains/{Module}/{Layer}/.
Repository chỉ query DB; không business logic.
Controller không query DB, không validate trực tiếp, không business logic.
Mọi API có input đều phải có FormRequest (extends BaseRequest).
Luôn trả qua API Resource, trừ endpoint /select.
Luôn dùng responseCommon() / paginateResponse() / cursorResponse() — không return response()->json(...).
Message luôn qua __('domains/{module}.{key}').
Service bắt buộc có protected string $notFoundMessage = 'domains/{module}.not_found'.
Service bắt buộc override paginate() và cursorPaginate().
Transaction chỉ mở trong Service (DB::beginTransaction/commit/rollBack).
Lỗi nghiệp vụ throw ApiException, không tự trả response lỗi trong Controller.
PHP 8.3 + PSR-12 + SOLID.