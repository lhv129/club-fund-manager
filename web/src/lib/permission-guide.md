# Permission Guide

Tài liệu tổng quan hệ thống phân quyền — Club Fund Manager.

---

## 1. Tổng quan — 3 tầng kiểm soát

```
Tầng 1 — Layout gate (Server Component)   → redirect nếu không đủ quyền
Tầng 2 — Nav filter (Client Component)    → ẩn menu item không có quyền
Tầng 3 — Page & Button gate               → ẩn/hiện button, guard nội dung trang
```

Mọi check đều đi qua **một hàm duy nhất**: `can(perms, isSuperAdmin, module, action, clubId?)`.

---

## 2. 5 Role — 2 Scope — 4 Permission Shape

### 2.1 Role

| Role        | is_superadmin | is_system_admin | Scope         |
|-------------|:---:|:---:|---------------|
| superadmin  | ✅ | —  | bypass tất cả |
| admin       | ❌ | ✅ | system        |
| owner       | ❌ | ❌ | club          |
| manager     | ❌ | ❌ | club          |
| member      | ❌ | ❌ | club          |

> **Hybrid:** 1 user vừa là admin hệ thống vừa là thành viên CLB → permissions
> merge hai shape, không collide vì key system ≠ `club_{id}`.

### 2.2 Scope

| Scope  | Ý nghĩa                                    | Truyền `clubId`? |
|--------|--------------------------------------------|:----------------:|
| system | Quản trị hệ thống: users, roles, modules … | ❌ null/undefined |
| club   | Workspace CLB: members, funds, invites …   | ✅ số nguyên      |

> ⚠️ **Quy tắc vàng:** `clubId = null` **KHÔNG** có nghĩa "bất kỳ club nào".
> Nó là system scope. Không bao giờ fallback "any club".

### 2.3 4 Permission Shape

```ts
// Shape 1 — Superadmin: bypass tất cả
permissions = ["*"]

// Shape 2 — System role (admin): flat module → actions
permissions = {
  "club":        ["view", "create", "update", "delete"],
  "user":        ["view", "create", "update", "delete"],
  "role":        ["view"],
  "fund":        ["view", "create", "update", "delete"],
  ...
}

// Shape 3 — Club role (owner/manager/member): nested dưới club_{id}
permissions = {
  "club_1": {
    "club":   ["view"],
    "member": ["view"],
    "fund":   ["view"]
  },
  "club_2": {
    "club":   ["view", "update", "delete"],
    "member": ["view"],
    "fund":   ["view", "create", "update"]
  }
}

// Shape 4 — Hybrid (admin + club member): merge Shape 2 + Shape 3
permissions = {
  "club":   ["view", "create"],     // flat = system scope
  "user":   ["view"],               // flat = system scope
  "club_5": {                       // nested = club scope
    "fund": ["view", "create"]
  }
}
```

### 2.4 Detect role từ permissions

```ts
import { systemPermissions, isClubKey } from "@/lib/permissions";

// Superadmin
const isSuperAdmin = Array.isArray(perms) && perms.includes("*");

// System role — is_system_admin: true HOẶC permissions có flat keys
const isSystemAdmin =
  user.is_system_admin ||
  hasAnySystemPermission(user.permissions, false);
  // hasAnySystemPermission = systemPermissions(perms) !== null
  //   = có ít nhất 1 key không phải club_X

// Club role — permissions chỉ có club_X keys
const isClubOnlyUser =
  !isSuperAdmin &&
  !isSystemAdmin &&
  Object.keys(perms).every(isClubKey);
```

---

## 3. Hàm `can()` — logic trung tâm

```ts
can(
  perms: PermissionMap | null,
  isSuperAdmin: boolean,
  module: string,
  action: string,
  clubId?: number | null,   // undefined | null → system scope; number → club scope
): boolean
```

**Luồng xử lý:**

```
can(perms, isSuperAdmin, module, action, clubId?)
│
├─ isSuperAdmin === true          → return true  (bypass)
├─ perms === ["*"]                → return true  (bypass)
├─ perms null/undefined           → return false
│
├─ clubId == null (system scope)
│   └─ systemPermissions(perms)?.[module]?.includes(action)
│       ├─ Lọc bỏ club_X keys → chỉ giữ flat keys
│       └─ return perms[module]?.includes(action) ?? false
│
└─ clubId = number (club scope)
    └─ clubPermissions(perms, clubId)?.[module]?.includes(action)
        ├─ Lấy perms["club_{clubId}"]
        └─ return nested[module]?.includes(action) ?? false
```

### Ví dụ thực tế

```ts
// User có permissions của login response mẫu (club_1 view-only, club_2 update+delete)

// ✅ Đúng — club scope, truyền clubId
hasPermission("club", "update", 2)   // true  (club_2.club = ["view","update","delete"])
hasPermission("club", "update", 1)   // false (club_1.club = ["view"])
hasPermission("club", "delete", 2)   // true
hasPermission("fund",  "create", 2)  // true  (club_2.fund = ["view","create","update"])

// ❌ Sai — system scope, không có flat keys → luôn false
hasPermission("club", "update")      // false (không truyền clubId = system scope)
hasPermission("club", "update", null)// false (null = system scope)

// ✅ Superadmin — bypass tất cả
// permissions = ["*"] → mọi can() đều true
```

---

## 4. Helpers

| Helper | Mục đích |
|--------|---------|
| `can(perms, isSuperAdmin, module, action, clubId?)` | Check 1 permission cụ thể |
| `canAccessClub(perms, isSuperAdmin, clubId)` | User có quyền vào club workspace không? (layout gate) |
| `hasAnyClubPermission(perms, isSuperAdmin)` | User thuộc ít nhất 1 CLB? (nút "← Quay lại CLB") |
| `hasAnySystemPermission(perms, isSuperAdmin)` | User có quyền system nào không? (admin layout gate) |
| `systemPermissions(perms)` | Lấy `{ module: actions }` system scope |
| `clubPermissions(perms, clubId)` | Lấy `{ module: actions }` của 1 CLB cụ thể |
| `scopeKey(clubId)` | `2` → `"club_2"` |
| `isClubKey(key)` | `"club_2"` → `true`, `"club"` → `false` |

---

## 5. `useAuth` hook — dùng trong Client Component

```ts
const {
  isSuperAdmin,    // user.is_superadmin
  isSystemAdmin,   // user.is_system_admin || flat permission keys detected
  hasPermission,   // (module, action, clubId?) => boolean — wrap can()
  canAccessClub,   // (clubId) => boolean
  hasAnyClubPermission, // () => boolean
} = useAuth();
```

### Pattern chuẩn

```tsx
// ── System scope (admin pages) ──────────────────────────────────────────────
// Module thuộc hệ thống: user, role, permission, module, club (system)
// KHÔNG truyền clubId

const canViewUsers   = isSuperAdmin || hasPermission("user",   "view");
const canCreateRole  = isSuperAdmin || hasPermission("role",   "create");
const canDeleteClub  = isSuperAdmin || hasPermission("club",   "delete"); // tạo/xoá global

// ── Club scope (club workspace) ─────────────────────────────────────────────
// Module thuộc CLB: member, fund, transaction, invite, webhook, ...
// TRUYỀN club.id

const canViewMembers = isSuperAdmin || hasPermission("member", "view",   club.id);
const canCreateFund  = isSuperAdmin || hasPermission("fund",   "create", club.id);
const canEditMember  = isSuperAdmin || hasPermission("member", "update", club.id);

// ── Per-card (ClubsPageClient) ───────────────────────────────────────────────
// Khi hiển thị danh sách CLB, quyền edit/delete từng card phải check từng club.id
// KHÔNG dùng global canUpdate vì mỗi CLB có permission khác nhau

const canUpdateClub = (clubId: number) =>
  isSuperAdmin || hasPermission("club", "update", clubId);
const canDeleteClub = (clubId: number) =>
  isSuperAdmin || hasPermission("club", "delete", clubId);
```

### ❌ Anti-patterns

```ts
// SAI: null = system scope, không phải "any club"
hasPermission("member", "view", null);

// SAI: user module là system scope, không check theo club
hasPermission("user", "view", club.id);

// SAI: club.update không truyền clubId → luôn false với club-scoped user
const canUpdate = hasPermission("club", "update"); // global, thiếu clubId
// → dùng per-card: canUpdateClub(club.id)
```

---

## 6. Tầng gate — nơi check từng loại

### 6.1 Tầng 1 — Layout gate (Server Component)

```ts
// admin/layout.tsx
if (!profile.is_superadmin && !profile.is_system_admin &&
    !hasAnySystemPermission(profile.permissions, false)) {
  redirect(`/${locale}/`);
}

// club/[slug]/layout.tsx
if (!canAccessClub(profile.permissions, profile.is_superadmin, club.id)) {
  notFound();
}
```

### 6.2 Tầng 2 — Nav filter (Client Component)

```tsx
// AdminSidebar — system scope, không truyền clubId
const visibleItems = ADMIN_NAV_ITEMS.filter(item =>
  isSuperAdmin || isSystemAdmin || hasPermission(item.module, item.action)
);

// ClubSidebar — club scope, truyền club.id
const visibleItems = CLUB_NAV_ITEMS.filter(item =>
  isSuperAdmin || hasPermission(item.module, item.action, club.id)
);
```

### 6.3 Tầng 3 — Page & Button gate (Client Component)

```tsx
// Page guard
if (!isSuperAdmin && !hasPermission("member", "view", club.id)) {
  return <Forbidden />;
}

// Button guard
{(isSuperAdmin || hasPermission("member", "create", club.id)) && (
  <Button onClick={openCreate}>Thêm thành viên</Button>
)}

// Per-card (ClubsPageClient)
<ClubCard
  canUpdate={canUpdateClub(club.id)}
  canDelete={canDeleteClub(club.id)}
  ...
/>
```

---

## 7. Root landing — phân luồng sau login

```
/{locale}/  (Server Component — fetch profile + clubs)
│
├─ Chưa login                              → redirect /{locale}/login
├─ is_superadmin || is_system_admin        → redirect /{locale}/admin
├─ 1 club truy cập được                   → redirect /{locale}/club/{slug}/dashboard
├─ 2+ clubs                               → render <ClubsPageClient clubs total />
└─ 0 club                                 → render <NoClubClient />
```

`ClubsPageClient` nhận `clubs` đã qua filter `canAccessClub` ở Server Component.
Không tự fetch danh sách — chỉ paginate thêm qua `clubServiceClient.list({ limit: 10, page })`.

---

## 8. Module slug chuẩn

| Scope  | Module slug         | Mô tả                    |
|--------|---------------------|--------------------------|
| system | `user`              | Quản lý người dùng       |
| system | `role`              | Quản lý chức vụ          |
| system | `permission`        | Phân quyền               |
| system | `module`            | Quản lý phân hệ          |
| system | `club`              | Tạo/xoá CLB (system)    |
| club   | `club`              | Sửa thông tin CLB        |
| club   | `member`            | Quản lý thành viên       |
| club   | `fund`              | Quản lý quỹ              |
| club   | `transaction`       | Giao dịch                |
| club   | `exchange_session`  | Phiên đổi quỹ            |
| club   | `webhook`           | Webhook                  |
| club   | `role`              | Chức vụ trong CLB        |

> `club` module xuất hiện ở cả 2 scope với ý nghĩa khác nhau:
> - system scope → tạo/xoá CLB toàn cục
> - club scope → sửa thông tin của CLB cụ thể (cần truyền `clubId`)

---

## 9. Checklist khi thêm tính năng mới

- [ ] Xác định module slug và action (`view` / `create` / `update` / `delete`)
- [ ] Xác định scope: system hay club?
- [ ] Nếu club scope → luôn truyền `clubId` vào `hasPermission`
- [ ] Thêm nav item với `module` + `action` vào `ADMIN_NAV_ITEMS` hoặc `CLUB_NAV_ITEMS`
- [ ] Gate tầng 1 (layout): đã có cho admin và club layout
- [ ] Gate tầng 3 (button): `{canXxx && <Button/>}` trong PageClient
- [ ] Backend: thêm module slug vào bảng `modules` và gán cho roles tương ứng
