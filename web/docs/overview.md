# Next.js Frontend — Club Fund Manager

> **Tổng quan dự án / Architecture Overview**
>
> Base **Admin Component & Architecture** được xây dựng/cập nhật lần cuối: **19/10/2026**.

## 1. Công nghệ sử dụng

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **next-intl** — đa ngôn ngữ / locale
- **Zustand** — state management
- **TanStack Query** (`@tanstack/react-query`) — data fetching, cache và mutations
- Backend API: **Laravel API**

---

## 2. Mục đích của project

Đây là frontend cho hệ thống **Club Fund Manager**, được tổ chức theo hướng **domain-driven**, trong đó frontend mirror theo các domain của backend.

Project có 2 workspace chính:

1. **Admin workspace** — quản trị hệ thống.
2. **Club workspace** — quản lý dữ liệu và hoạt động của từng câu lạc bộ.

Root `/` là nơi quyết định user sẽ đi vào workspace nào sau khi đăng nhập.

---

## 3. Locale / Đa ngôn ngữ

Project sử dụng **next-intl** và hỗ trợ locale trên URL.

Ví dụ:

```text
/vi/...
/en/...
```

### Nguồn locale duy nhất

Chỉ chỉnh sửa:

```text
src/config/locales.json
```

Các locale được export thông qua:

```text
src/lib/locales.ts
```

Bao gồm:

- `LOCALES`
- `LOCALE_CODES`
- `DEFAULT_LOCALE`
- `FALLBACK_LOCALE`

### Translation

UI messages:

```text
src/messages/
├── vi.json
└── en.json
```

Next-intl configuration:

```text
src/i18n/
├── routing.ts
└── request.ts
```

### Locale của Club

Club sử dụng slug theo locale:

```text
/vi/club/cau-lac-bo-ha-noi
/en/club/hanoi-badminton-club
```

Backend resolve Club thông qua:

```text
club_translations.slug + locale
```

Khi đổi locale, `LocaleSwitcher` sẽ tìm slug tương ứng trong `club.translations` đã được hydrate từ store và đổi URL, không cần gọi API chỉ để lấy slug mới.

---

## 4. Cấu trúc workspace

### Root

```text
/{locale}/
```

Root page là Server Component và chịu trách nhiệm phân luồng sau login.

Flow:

```text
Chưa login
    ↓
/{locale}/login

superadmin / system admin
    ↓
/{locale}/admin

Chỉ có 1 club truy cập được
    ↓
/{locale}/club/{slug}/dashboard

Có từ 2 club trở lên
    ↓
ClubsPageClient

Không có club
    ↓
NoClubClient
```

Root sử dụng:

- `LandingShell`
- `ClubsPageClient`
- `NoClubClient`

---

# 5. Admin Component

## 5.1 Admin workspace

URL:

```text
/{locale}/admin/...
```

Admin workspace phục vụ quản trị hệ thống:

- Dashboard
- Users
- Roles
- Permissions
- Settings

Cấu trúc chính:

```text
src/app/[locale]/admin/
├── layout.tsx
└── (system)/
    ├── layout.tsx
    ├── page.tsx
    ├── users/page.tsx
    ├── roles/page.tsx
    ├── permissions/page.tsx
    └── settings/page.tsx
```

### Admin layout

`admin/layout.tsx` thực hiện:

- Authentication
- Fetch profile
- Permission gate
- Render `AdminShell`

Điều kiện truy cập:

```text
superadmin
OR
is_system_admin
OR
có system permission
```

Nếu không đủ quyền:

```text
redirect("/{locale}/")
```

Root sẽ phân luồng lại user.

---

## 5.2 Admin UI components

Các component dùng chung cho Admin nằm tại:

```text
src/components/admin/
├── layout/
└── navigation/
```

Shared components:

```text
src/components/shared/
├── ui/
├── layout/
├── forms/
├── media/
└── feedback/
```

Một số component form dùng chung:

```text
DeleteConfirmModal.tsx
FormModal.tsx
FormModalWithMedia.tsx
```

Media:

```text
CustomImage.tsx
MediaImage.tsx
MediaUploader.tsx
```

---

# 6. Club workspace

URL:

```text
/{locale}/club/{slug}/...
```

Cấu trúc:

```text
src/app/[locale]/club/[slug]/
├── layout.tsx
├── dashboard/page.tsx
├── members/page.tsx
├── invites/page.tsx
└── settings/page.tsx
```

`club/[slug]/layout.tsx` thực hiện:

1. Authentication
2. Fetch profile
3. Fetch club theo slug
4. Kiểm tra `canAccessClub`
5. Render Club workspace

Nếu không có quyền truy cập:

```text
notFound()
```

---

# 7. Permission architecture

Hệ thống có **5 role**:

| Role | System | Club |
|---|---|---|
| `superadmin` | Toàn quyền | Toàn quyền |
| `admin` | System permissions | Có thể kết hợp club role |
| `owner` | - | Club |
| `manager` | - | Club |
| `member` | - | Club |

Có **2 scope**:

```text
SYSTEM
├── users
├── roles
├── permissions
└── settings

CLUB
├── members
├── funds
├── transactions
└── ...
```

Một user có thể thuộc nhiều club và có role khác nhau ở từng club.

Helper permission trung tâm:

```ts
can(perms, isSuperAdmin, module, action, clubId)
```

Quy ước:

```text
clubId = null / undefined
    → SYSTEM SCOPE

clubId = number
    → CLUB SCOPE
```

Không có fallback `any club` khi `clubId` null.

---

# 8. Gate pattern 3 tầng

Permission được kiểm soát ở 3 tầng.

## Tầng 1 — Layout Gate

Server Component:

```text
admin/layout.tsx
admin/(system)/layout.tsx
club/[slug]/layout.tsx
```

Mục đích:

- Không cho truy cập workspace/page nếu không đủ quyền.
- Redirect hoặc `notFound()` tùy workspace.

---

## Tầng 2 — Navigation Gate

Client Component.

Admin:

```text
Sidebar.tsx
```

Filter navigation dựa trên:

```ts
hasPermission(module, action)
```

Club:

```text
ClubSidebar.tsx
```

Filter dựa trên:

```ts
hasPermission(module, action, club.id)
```

---

## Tầng 3 — Page & Button Gate

Page:

```tsx
if (!hasPermission("member", "view", club.id)) {
    return <Forbidden />;
}
```

Button:

```tsx
{hasPermission("member", "create", club.id) && (
    <Button />
)}
```

System:

```tsx
if (!isSuperAdmin && !hasPermission("user", "view")) {
    return <Forbidden />;
}
```

---

# 9. Domain-driven structure

Domain nằm tại:

```text
src/domains/
```

Các domain chính:

```text
auth/
club/
role/
permission/
module/
```

Ví dụ:

```text
src/domains/auth/
├── types/
├── hooks/
├── stores/
├── services/
└── components/
```

Auth:

```text
useAuth()
authStore
authService
authServiceServer
```

Club:

```text
useClub()
useHydrateClub()
clubStore
clubService
clubServiceServer
clubMemberService
clubInviteService
```

---

# 10. HTTP / Repository Architecture

HTTP layer:

```text
src/lib/http/
├── types.ts
├── queryString.ts
├── serverAdapter.ts
└── browserAdapter.ts
```

Có 2 adapter:

### Server

```text
serverAdapter.ts
```

- Server-only
- Cookie Bearer token
- Gọi Laravel API trực tiếp
- Có cơ chế refresh token ở Route Handler context

### Browser

```text
browserAdapter.ts
```

- Client-safe
- Gọi:

```text
/api/proxy/[...path]
```

Proxy sau đó gọi Laravel API thông qua server adapter.

---

# 11. BaseRepository

Toàn bộ CRUD cơ bản được viết một lần tại:

```text
src/lib/baseRepository.ts
```

Domain service chỉ cần khai báo:

```text
resource
adapter
```

Các method chuẩn:

```text
list()
show()
showBySlug()
select()
create()
update()
destroy()
toggleStatus()
updateStatus()
```

Mục tiêu:

> Không viết lại logic HTTP/CRUD cho từng module.

---

# 12. TanStack Query

Toàn bộ `PageClient` sử dụng TanStack Query để quản lý data fetching và cache.

Provider:

```text
QueryClientProvider
```

được đặt ở:

```text
src/[locale]/layout.tsx
```

hoặc:

```text
src/providers/index.ts
```

### Chiến lược cache

| Operation | Strategy |
|---|---|
| List | `useQuery` |
| Create | `invalidateQueries` |
| Update | `invalidateQueries` |
| Delete | `setQueryData` |
| Toggle | `setQueryData` |

Query key:

```ts
const queryKey = ["modules", params] as const;
```

Invalidate toàn resource:

```ts
queryClient.invalidateQueries({
    queryKey: ["modules"],
});
```

Update cache hiện tại:

```ts
queryClient.setQueryData(
    ["modules", params],
    old => ...
);
```

---

# 13. Custom hooks cho module

TanStack Query logic không đặt trực tiếp trong `PageClient`.

Mỗi domain/module có hook riêng:

```text
domains/<module>/hooks/use<Module>s.ts
```

Ví dụ:

```text
domains/module/hooks/useModules.ts
```

Hook chịu trách nhiệm:

- `useQuery`
- `useMutation`
- `setQueryData`
- `invalidateQueries`
- toast
- submit handlers

Trong khi `PageClient` chỉ chịu trách nhiệm:

- Render UI
- Modal state
- UI state
- Gọi handlers từ custom hook

Flow:

```text
PageClient
    ↓
use<Module>s()
    ↓
<module>Service
    ↓
BaseRepository
    ↓
HTTP Adapter
    ↓
Laravel API
```

---

# 14. Auth & Token

Token được lưu trong **httpOnly cookie**.

```text
access_token  → 1h
refresh_token → 7d
```

Refresh token sử dụng một flow dùng chung:

```text
lib/http/tokenRefresh.ts
```

Có cơ chế **single-flight dedupe** để tránh nhiều request cùng refresh một `refresh_token`.

Các context liên quan:

```text
/api/proxy
/api/auth/refresh
SSR
```

đều sử dụng flow refresh chung.

---

# 15. Login flow

Login route:

```text
POST /api/auth/login
```

Chỉ:

1. Set cookie.
2. Return JSON `{ user }`.

Không redirect trực tiếp từ login route.

Flow frontend:

```text
LoginForm
    ↓
login()
    ↓
router.push("/")
    ↓
Root page
    ↓
phân luồng theo role / club
```

Logic redirect được tập trung tại root page để dễ bảo trì.

---

# 16. Data scope theo Club

Một số resource dùng chung cho cả Admin và Club:

```text
members
invites
bank accounts
fund periods
monthly contributions
transactions
playing schedules
exchange sessions
```

Endpoint dùng dạng phẳng:

```text
GET /playing-schedules
```

Admin:

```text
GET /playing-schedules
```

Club:

```text
GET /playing-schedules?club_slug=my-club
```

Hook nhận `params`.

Club workspace merge:

```ts
{
    ...params,
    club_slug: slug
}
```

Create/update truyền `club_slug` trong body/FormData.

Không dùng:

```text
constructor clubSlug
```

và không dùng URL dạng:

```text
/clubs/{slug}/...
```

cho các resource dùng chung này.

---

# 17. Các file quan trọng

```text
src/
├── app/
├── domains/
├── components/
├── hooks/
├── lib/
│   ├── http/
│   ├── baseRepository.ts
│   ├── permissions.ts
│   ├── cookies.ts
│   ├── config.ts
│   ├── errors.ts
│   ├── locales.ts
│   └── translations.ts
├── config/
│   └── locales.json
├── i18n/
├── messages/
├── providers/
├── constants/
├── types/
└── utils/
```

---

# 18. Quy tắc phát triển module mới

Khi thêm một module mới, ưu tiên theo flow:

```text
1. Type
   ↓
2. Service
   ↓
3. Hook
   ↓
4. PageClient
   ↓
5. Navigation item
   ↓
6. Permission
```

Service kế thừa:

```text
BaseRepository
```

Hook quản lý:

```text
useQuery
useMutation
cache
toast
handlers
```

PageClient tập trung vào:

```text
UI
modal
form
table
filter
```

Navigation phải được filter bằng permission.

Page và action/button cần có permission gate phù hợp.

---

# 19. Cheat sheet Permission

### System scope

```ts
const { hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();

hasPermission("user", "view");

hasPermission("role", "create");
```

### Club scope

```ts
hasPermission("member", "view", club.id);

hasPermission("fund", "create", club.id);
```

### Superadmin

```text
superadmin → bypass permission
```

Không cần check permission chi tiết.

### Không được làm

```ts
hasPermission("member", "view", null);
```

`null` không có nghĩa là `any club`, mà là **system scope**.

Không truyền `club.id` cho system module:

```ts
hasPermission("user", "view", club.id);
```

---

# 20. Nguyên tắc kiến trúc tổng quát

Project được tổ chức theo các nguyên tắc:

- **Locale-first routing**
- **Domain-driven structure**
- **Admin / Club workspace tách biệt**
- **Permission-driven UI**
- **Server/Client HTTP adapter tách biệt**
- **BaseRepository dùng chung**
- **TanStack Query làm lớp cache/data fetching**
- **Custom hooks tách business/data logic khỏi UI**
- **Root page chịu trách nhiệm phân luồng sau login**
- **httpOnly cookie cho authentication**
- **Một nguồn duy nhất cho cấu hình locale**
- **Club slug thay đổi theo locale**
- **Permission gate 3 tầng: Layout → Navigation → Page/Button**

---

## 21. Trạng thái của Base Admin

**Admin Component / Architecture Base**

```text
Last built / updated:
19/10/2026
```

Đây là mốc dùng để tham chiếu khi tiếp tục phát triển các module Admin mới. Khi thêm module, nên giữ nguyên các pattern đã được định nghĩa trong tài liệu này thay vì tạo một cách triển khai riêng.
