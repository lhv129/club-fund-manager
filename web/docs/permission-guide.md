# Permission Guide — Next.js Frontend

Tài liệu hướng dẫn tích hợp logic phân quyền mới (5 role + club-scoped + system-scoped) vào Next.js frontend.

Đọc file này **sau** `api-overview.md` để hiểu convention chung trước.

---

## 1. Tổng quan — 5 role & 2 scope

### Thứ bậc role

| # | Role slug    | Scope  | Bypass | Quyền cấp bởi          |
|---|--------------|--------|--------|------------------------|
| 0 | `superadmin` | system | ✅ tất cả | — (bypass qua `isSuperAdmin()`) |
| 1 | `admin`      | system | ❌      | superadmin (configurable qua `POST /roles/{id}/permissions`) |
| 2 | `owner`      | club   | ❌      | cố định trong `RoleSeeder` |
| 3 | `manager`    | club   | ❌      | cố định trong `RoleSeeder` |
| 4 | `member`     | club   | ❌      | cố định trong `RoleSeeder` |

### 2 scope phân quyền

| Scope   | Ý nghĩa                              | `club_member_roles.club_id` | Ví dụ role          |
|---------|--------------------------------------|-----------------------------|---------------------|
| system  | Quyền hệ thống (users, roles, ...)   | `NULL`                      | superadmin, admin   |
| club    | Quyền trong 1 club cụ thể            | `1`, `2`, ...               | owner, manager, member |

**Quy tắc gốc**: 1 user có thể thuộc nhiều club với role khác nhau ở từng club.
- User A: `member` ở club 1 + `manager` ở club 2 → quyền khác nhau per-club.
- User B: `admin` (system) + `member` ở club 5 → có cả quyền system + quyền club 5.

---

## 2. Contract `/auth/profile` & `/auth/login` mới

### Field mới trong response

```jsonc
{
  "id": 3,
  "fullname": "Hoàng Long",
  "email": "hoanglong@gmail.com",
  "is_superadmin": false,
  "is_system_admin": false,          // ← MỚI: admin (system scope)
  "is_active": null,
  "permissions": { ... }             // ← format mới (xem bên dưới)
}
```

### 3 hình dạng (shape) của `permissions`

`permissions` **luôn là object** hoặc `["*"]` — **không bao giờ** là array tuần tự `[{...},{...}]`. Nếu thấy array tuần tự → đang dùng code cũ, cần cập nhật.

#### Shape 1 — Superadmin: `["*"]`

```json
"permissions": ["*"]
```

`is_superadmin: true` → bypass mọi quyền. Frontend không cần check `permissions` chi tiết.

#### Shape 2 — Admin (system scope): flat object, key = module slug

```json
"permissions": {
  "club": ["view"],
  "member": ["view", "create", "update", "delete"],
  "fund": ["view", "create", "update"],
  "transaction": ["view", "create", "update"],
  "exchange_session": ["view", "create", "update", "delete"],
  "webhook": ["view"],
  "user": ["view", "create"]         // ← module do SA cấp cho admin
}
```

`is_system_admin: true`. Key top-level là **module slug** (`club`, `member`, `user`, ...) — **FLAT**, không wrapper.

#### Shape 3 — Owner/Manager/Member (club scope): nested `club_{id}`

```json
"permissions": {
  "club_1": {
    "club": ["view"],
    "member": ["view"],
    "fund": ["view"],
    "transaction": ["view"],
    "exchange_session": ["view"]
  },
  "club_2": {
    "club": ["view"],
    "member": ["view", "create", "update", "delete"],
    "fund": ["view", "create", "update"],
    "transaction": ["view", "create", "update"],
    "exchange_session": ["view", "create", "update", "delete"],
    "webhook": ["view"]
  }
}
```

User này: `member` ở club 1, `manager` ở club 2 — phân biệt qua key `club_1` / `club_2`.

#### Shape 4 (hybrid) — User vừa admin vừa member của club

```json
"permissions": {
  "club": ["view"],                          // ← system scope (admin)
  "user": ["view", "create"],               // ← system scope (admin)
  "club_5": {                                // ← club scope (member ở club 5)
    "club": ["view"],
    "member": ["view"]
  }
}
```

Merge của shape 2 + 3. **KHÔNG collide** vì module slug (`club`, `user`, ...) khác format key `club_{id}` (luôn có prefix `club_` + số).

### Cách phân biệt shape ở frontend

```ts
function getPermissionShape(perms: PermissionMap): "superadmin" | "system" | "club" | "hybrid" {
  if (Array.isArray(perms)) return "superadmin";              // ["*"]
  const keys = Object.keys(perms);
  const hasClubScope = keys.some((k) => k.startsWith("club_"));
  const hasSystemScope = keys.some((k) => !k.startsWith("club_"));
  if (hasClubScope && hasSystemScope) return "hybrid";
  if (hasSystemScope) return "system";
  return "club";
}
```

---

## 3. TypeScript types — cập nhật `src/domains/auth/types/index.ts`

```ts
/**
 * Permission map từ backend — 4 shape (xem permission-guide.md §2).
 *
 * ["*"]                                   → superadmin (bypass)
 * { [module]: string[] }                  → admin (system scope, flat)
 * { [clubId: `club_${number}`]: {...} }  → owner/manager/member (club scope, nested)
 * { ...merge... }                         → hybrid (admin + club member)
 *
 * Lưu ý: key top-level có thể là module slug (string) HOẶC `club_{id}`.
 * Phân biệt bằng helper isClubKey() / scopeKey().
 */
export type PermissionMap =
  | ["*"]
  | Record<string, string[] | Record<string, string[]>>;

/** User profile — matches Auth/Resources/ProfileResource. */
export interface Profile {
  id: number;
  fullname: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  is_superadmin: boolean;
  is_system_admin: boolean;          // ← MỚI
  is_active: boolean | null;
  permissions: PermissionMap;
}
```

> **Lưu ý**: `permissions` dùng union type thay vì generic — 4 shape khác nhau cùng tồn tại trên 1 field. Helper bên dưới xử lý runtime discrimination.

---

## 4. Helper `can()` — core của toàn bộ phân quyền

Tạo file mới `src/lib/permissions.ts`:

```ts
import type { PermissionMap } from "@/domains/auth/types";

/**
 * Scope key helpers — mirror backend quy ước `club_{id}`.
 */
export function scopeKey(clubId: number): `club_${number}` {
  return `club_${clubId}`;
}

export function isClubKey(key: string): key is `club_${number}` {
  return /^club_\d+$/.test(key);
}

/**
 * Lấy module→actions ở SYSTEM scope (admin/role/permission/user/...).
 *
 * @returns object { module: [actions] } hoặc null nếu user không có system scope.
 */
export function systemPermissions(
  perms: PermissionMap,
): Record<string, string[]> | null {
  if (Array.isArray(perms)) return null;                        // superadmin bypass
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(perms)) {
    if (isClubKey(key)) continue;                               // bỏ club scope
    if (Array.isArray(value)) result[key] = value;              // flat module → actions
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Lấy module→actions ở CLUB scope cho 1 club cụ thể.
 *
 * @returns object { module: [actions] } hoặc null nếu user không có quyền ở club đó.
 */
export function clubPermissions(
  perms: PermissionMap,
  clubId: number,
): Record<string, string[]> | null {
  if (Array.isArray(perms)) return null;                        // superadmin bypass
  const key = scopeKey(clubId);
  const value = perms[key];
  if (!value || Array.isArray(value)) return null;             // không phải club scope
  return value as Record<string, string[]>;
}

/**
 * Check permission — mirror backend `User::hasPermission(module, action, clubId)`.
 *
 * @param module   module slug (vd: 'club', 'user', 'member')
 * @param action   action (vd: 'view', 'create', 'update', 'delete')
 * @param clubId   scope:
 *                 - undefined/null → SYSTEM SCOPE (admin/role/permission/user/...)
 *                 - number         → CLUB SCOPE (chỉ club cụ thể)
 *
 * Quy tắc:
 *   - is_superadmin → bypass tất cả
 *   - permissions === ["*"] → bypass tất cả
 *   - clubId === null/undefined → check system scope (flat module key)
 *   - clubId === number → check `club_{id}` key
 *
 * KHÔNG fallback "any club" khi clubId null — match backend hasPermission().
 */
export function can(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  module: string,
  action: string,
  clubId?: number | null,
): boolean {
  if (isSuperAdmin) return true;
  if (Array.isArray(perms) && perms.includes("*")) return true;
  if (!perms || Array.isArray(perms)) return false;

  if (clubId == null) {
    // SYSTEM SCOPE — flat top-level key = module slug.
    const sys = systemPermissions(perms);
    return sys?.[module]?.includes(action) ?? false;
  }

  // CLUB SCOPE — nested dưới club_{id}.
  const club = clubPermissions(perms, clubId);
  return club?.[module]?.includes(action) ?? false;
}

/**
 * Check user có bất kỳ quyền nào ở club cụ thể (dùng cho layout guard).
 * Superadmin → true. Còn lại → club_{id} có ít nhất 1 module non-empty.
 */
export function canAccessClub(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
  clubId: number,
): boolean {
  if (isSuperAdmin) return true;
  if (Array.isArray(perms)) return perms.includes("*");
  if (!perms) return false;
  const club = clubPermissions(perms, clubId);
  if (!club) return false;
  return Object.values(club).some(
    (actions) => Array.isArray(actions) && actions.length > 0,
  );
}

/**
 * Check user có quyền ở bất kỳ club nào (dùng cho "show back to clubs" button).
 */
export function hasAnyClubPermission(
  perms: PermissionMap | undefined | null,
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) return true;
  if (Array.isArray(perms)) return perms.includes("*");
  if (!perms || Array.isArray(perms)) return false;
  return Object.keys(perms).some(isClubKey);
}
```

---

## 5. Cập nhật `useAuth` hook — `src/domains/auth/hooks/useAuth.ts`

Thay toàn bộ logic `hasPermission` cũ bằng helper `can()` ở §4:

```ts
"use client";

import { useCallback, useRef, useLayoutEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/authService";
import { can, canAccessClub, hasAnyClubPermission } from "@/lib/permissions";
import type { LoginPayload, RegisterPayload, Profile } from "../types";

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    reset,
  } = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const profile = await authService.login(payload);
        setUser(profile);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<{ success: boolean; message: string }> => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.register(payload);
        return { success: response.success, message: response.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      reset();
    }
  }, [reset]);

  /**
   * Check permission — mirror backend hasPermission(module, action, clubId).
   *
   * @param module  module slug (vd: 'club', 'user', 'member')
   * @param action  action (vd: 'view', 'create', 'update', 'delete')
   * @param clubId  undefined/null → SYSTEM SCOPE; number → CLUB SCOPE
   */
  const hasPermission = useCallback(
    (module: string, action: string, clubId?: number | null): boolean => {
      if (!user) return false;
      return can(user.permissions, user.is_superadmin, module, action, clubId);
    },
    [user],
  );

  const isSuperAdmin = user?.is_superadmin ?? false;
  const isSystemAdmin = user?.is_system_admin ?? false;       // ← MỚI

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isSuperAdmin,
    isSystemAdmin,                                            // ← MỚI
    login,
    register,
    logout,
    hasPermission,
    canAccessClub: (clubId: number) =>
      user ? canAccessClub(user.permissions, user.is_superadmin, clubId) : false,
    hasAnyClubPermission: () =>
      user ? hasAnyClubPermission(user.permissions, user.is_superadmin) : false,
    clearError: () => setError(null),
  };
}

/**
 * Hydrate auth store từ server-fetched profile.
 */
export function useHydrateAuth(profile: Profile | null) {
  const setUser = useAuthStore((s) => s.setUser);
  const reset = useAuthStore((s) => s.reset);
  const hydratedRef = useRef(false);
  useLayoutEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (profile) setUser(profile);
    else reset();
  }, [profile, setUser, reset]);
}
```

---

## 6. Gate pattern 3 tầng

Phân quyền ở frontend = **UX** (ẩn/hiện menu, nút, redirect). Security thực nằm ở backend middleware `permission:module,action`. Đừng bao giờ nghĩ "frontend đã ẩn rồi thì an toàn".

### Tầng 1 — Layout gate (Server Component)

#### `src/app/[locale]/dashboard/layout.tsx` (admin workspace)

Giữ nguyên — chỉ check auth + fetch profile. KHÔNG permission gate ở đây vì `/dashboard/clubs` và `/dashboard/no-club` phải truy cập được bởi mọi user đã login.

#### `src/app/[locale]/dashboard/(system)/layout.tsx` (system pages)

```tsx
import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { systemPermissions } from "@/lib/permissions";
import type { Profile } from "@/domains/auth/types";
import { DashboardShell } from "@/components/layout/DashboardShell";

/**
 * Gate cho system pages (users, roles, permissions, settings, dashboard).
 * - Superadmin → luôn qua.
 * - Admin (system) → có bất kỳ system permission nào → qua.
 * - Club user (owner/manager/member) → KHÔNG có system permission → redirect /dashboard/clubs.
 */
export default async function SystemLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const token = await getAccessToken();
  if (!token) redirect(`/${locale}/login`);

  let profile: Profile | null = null;
  try {
    profile = (await authServiceServer.getProfile()).data;
  } catch {
    redirect(`/${locale}/login`);
  }
  if (!profile) redirect(`/${locale}/login`);

  const isSystemUser =
    profile.is_superadmin ||
    (systemPermissions(profile.permissions) !== null);

  if (!isSystemUser) {
    redirect(`/${locale}/dashboard/clubs`);
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
```

#### `src/app/[locale]/club/[slug]/layout.tsx` (club workspace)

```tsx
import { notFound, redirect } from "next/navigation";
import { getAccessToken } from "@/lib/cookies";
import { authServiceServer } from "@/domains/auth/services/authServiceServer";
import { clubServiceServer } from "@/domains/club/services/clubServiceServer";
import { canAccessClub } from "@/lib/permissions";
import type { Profile } from "@/domains/auth/types";
import type { Club } from "@/domains/club/types";
import { ClubShell } from "@/components/layout/ClubShell";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const token = await getAccessToken();
  if (!token) redirect(`/${locale}/login`);

  let profile: Profile | null = null;
  try {
    profile = (await authServiceServer.getProfile()).data;
  } catch {
    redirect(`/${locale}/login`);
  }
  if (!profile) redirect(`/${locale}/login`);

  let club: Club | null = null;
  try {
    const res = await clubServiceServer.showBySlug(slug);
    if (res.success) club = res.data;
  } catch {
    notFound();
  }
  if (!club) notFound();

  // Permission gate — dùng helper canAccessClub.
  if (!canAccessClub(profile.permissions, profile.is_superadmin, club.id)) {
    notFound();
  }

  return <ClubShell profile={profile} club={club}>{children}</ClubShell>;
}
```

### Tầng 2 — Nav filter (Client Component)

#### `src/components/layout/Sidebar.tsx` (system sidebar)

```tsx
export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const pathname = usePathname() as string;
  const { hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // System sidebar dùng SYSTEM SCOPE — không truyền clubId.
  const filtered = filterNav(
    ADMIN_NAV_ITEMS,
    (module, action) => hasPermission(module!, action!),   // clubId undefined → system
    isSuperAdmin || isSystemAdmin,                          // ← cho phép admin thấy nav
  );

  // ... (render như cũ)
}
```

#### `src/components/layout/ClubSidebar.tsx` (club sidebar)

```tsx
export function ClubSidebar({ open, onClose }: ClubSidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const tWorkspace = useTranslations("clubWorkspace") as (key: string) => string;
  const pathname = usePathname() as string;
  const { isSuperAdmin, hasPermission, hasAnyClubPermission } = useAuth();
  const { club } = useClub();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const currentLocale = useLocale() as string;

  const slug = pickTranslation(club?.translations, currentLocale)?.slug
    ?? (pathname.split("/")[2] ?? String(club?.id ?? ""));

  // Club sidebar dùng CLUB SCOPE — truyền club.id.
  const filtered = club
    ? CLUB_NAV_ITEMS.filter((item) =>
        hasPermission(item.module, item.action, club.id),    // ← club scope
      )
    : [];

  // Nút "← Quay lại danh sách CLB" — superadmin hoặc có quyền ở bất kỳ club nào.
  const showBackToClubs = isSuperAdmin || hasAnyClubPermission();

  // ... (render như cũ)
}
```

### Tầng 3 — Page & Button gate (Client Component)

```tsx
// Page gate — ví dụ trang members trong club workspace
export default function MembersPage() {
  const { hasPermission } = useAuth();
  const { club } = useClub();

  if (!club) return <Loading />;
  if (!hasPermission("member", "view", club.id)) {
    return <Forbidden />;
  }

  return (
    <div>
      <h1>Members</h1>

      {/* Button gate — chỉ hiện nút Create nếu có quyền member.create */}
      {hasPermission("member", "create", club.id) && (
        <Button onClick={handleCreate}>Add Member</Button>
      )}

      {/* Button gate — chỉ hiện nút Delete nếu có quyền member.delete */}
      {hasPermission("member", "delete", club.id) && (
        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
}
```

```tsx
// System page gate — ví dụ trang users trong dashboard
export default function UsersPage() {
  const { hasPermission, isSuperAdmin } = useAuth();

  // System scope — KHÔNG truyền clubId.
  if (!isSuperAdmin && !hasPermission("user", "view")) {
    return <Forbidden />;
  }

  return (
    <div>
      <h1>Users</h1>
      {hasPermission("user", "create") && (
        <Button onClick={handleCreate}>Add User</Button>
      )}
    </div>
  );
}
```

---

## 7. Redirect logic sau login — cập nhật `LoginForm.tsx`

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  clearError();
  if (!validate()) return;

  const success = await login(form);
  if (!success) return;

  // ── Redirect theo role + club access ────────────────────────────────────
  //  1. Superadmin                → /dashboard
  //  2. Admin (system, no club)   → /dashboard
  //  3. Đúng 1 club truy cập được → /club/{slug}/dashboard
  //  4. 2+ clubs                  → /dashboard/clubs (trang chọn club)
  //  5. 0 club / lỗi fetch         → /dashboard/no-club
  if (user?.is_superadmin || user?.is_system_admin) {
    router.push(APP_ROUTES.dashboard);
    router.refresh();
    return;
  }

  try {
    const res = await clubServiceClient.list({ limit: 100 });
    const clubs = (res.data ?? []).filter((c) =>
      user ? clubAccessible(user.permissions, user.is_superadmin, c.id) : false,
    );

    if (clubs.length === 1) {
      const slug = slugForLocale(clubs[0]);
      if (slug) {
        router.push(clubDashboardRoute(slug));
        router.refresh();
        return;
      }
    }

    if (clubs.length >= 2) {
      router.push(APP_ROUTES.dashboardClubs);
      router.refresh();
      return;
    }

    // 0 club → trang xin vào CLB
    router.push(APP_ROUTES.noClub);
    router.refresh();
  } catch {
    router.push(APP_ROUTES.noClub);
    router.refresh();
  }
};
```

Cập nhật helper `clubAccessible` trong `LoginForm.tsx`:

```ts
import { canAccessClub } from "@/lib/permissions";

/** Kiểm user có truy cập club này không (mirror canAccessClub helper). */
function clubAccessible(
  permissions: Profile["permissions"],
  isSuperAdmin: boolean,
  clubId: number,
): boolean {
  return canAccessClub(permissions, isSuperAdmin, clubId);
}
```

---

## 8. Bảng ánh xạ 5 role → frontend behavior

| Role      | `is_superadmin` | `is_system_admin` | Shape `permissions`            | Sidebar thấy                              | Redirect sau login                |
|-----------|-----------------|-------------------|--------------------------------|--------------------------------------------|-----------------------------------|
| superadmin| `true`          | `false`           | `["*"]`                        | Toàn bộ system nav                        | `/dashboard`                      |
| admin     | `false`         | `true`            | flat `{ module: [...] }`       | System nav theo quyền SA cấp              | `/dashboard`                      |
| owner     | `false`         | `false`           | `{ "club_{id}": {...} }`       | Club nav (đầy đủ)                         | 1 club → `/club/{slug}/dashboard`; 2+ → `/dashboard/clubs` |
| manager   | `false`         | `false`           | `{ "club_{id}": {...} }`       | Club nav (giảm theo quyền)                 | như owner                         |
| member    | `false`         | `false`           | `{ "club_{id}": {...} }`       | Club nav (ít nhất — chỉ view)             | như owner                         |

### Hybrid user (admin + member của club X)

| Trường                            | Giá trị                                              |
|-----------------------------------|------------------------------------------------------|
| `is_superadmin`                   | `false`                                              |
| `is_system_admin`                 | `true`                                               |
| `permissions`                     | `{ "club":[sys], "user":[sys], "club_X":{...} }`    |
| Tại `/dashboard/*` (system)      | Dùng system scope (flat)                             |
| Tại `/club/{slug}/...` (club X)  | Dùng club scope `club_X`                             |
| Redirect sau login                | `/dashboard` (vì `is_system_admin: true`)            |

---

## 9. Cheat sheet — quy tắc dùng `hasPermission`

```ts
const { hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();

// ── SYSTEM SCOPE (dashboard pages: users, roles, permissions, settings) ──
// KHÔNG truyền clubId → check ở flat top-level (module slug key).
hasPermission("user", "view");          // admin có user.view?
hasPermission("role", "create");        // admin có role.create?
hasPermission("club", "view");          // admin có club.view ở system scope?

// ── CLUB SCOPE (club workspace: members, funds, invites, ...) ─────────────
// TRUYỀN clubId → check ở nested club_{id}.
hasPermission("member", "view", club.id);     // user có member.view ở club này?
hasPermission("fund", "create", club.id);     // user có fund.create ở club này?
hasPermission("club", "update", club.id);     // user có club.update ở club này?

// ── SUPERADMIN BYPASS ──────────────────────────────────────────────────────
// isSuperAdmin === true → hasPermission() luôn trả true (bypass).
// KHÔNG cần check permissions chi tiết.

// ── SAI (KHÔNG làm) ─────────────────────────────────────────────────────────
hasPermission("member", "view", null);  // ❌ null = system scope, không phải "any club"
hasPermission("user", "view", club.id); // ❌ user là system module, không có club scope
```

---

## 10. Checklist cập nhật Next.js

- [ ] `src/domains/auth/types/index.ts` — thêm `is_system_admin` vào `Profile`, cập nhật `PermissionMap`
- [ ] `src/lib/permissions.ts` — tạo mới (helper `can`, `canAccessClub`, `scopeKey`, ...)
- [ ] `src/domains/auth/hooks/useAuth.ts` — thay `hasPermission` bằng `can()`, thêm `isSystemAdmin`, `canAccessClub`, `hasAnyClubPermission`
- [ ] `src/app/[locale]/dashboard/(system)/layout.tsx` — thêm system gate
- [ ] `src/app/[locale]/club/[slug]/layout.tsx` — thay `canAccessClub()` bằng helper
- [ ] `src/components/layout/Sidebar.tsx` — `isSuperAdmin || isSystemAdmin`, system scope (không clubId)
- [ ] `src/components/layout/ClubSidebar.tsx` — `hasAnyClubPermission()`, club scope (truyền `club.id`)
- [ ] `src/domains/auth/components/LoginForm.tsx` — thêm case `is_system_admin` vào redirect
- [ ] Kiểm tra mọi page component dùng `hasPermission` — đảm bảo truyền `clubId` đúng scope

---

## 11. Quy tắc vàng

1. **Frontend gate = UX**. Bất kỳ ai sửa JS trong DevTools cũng bypass được. **Security thực ở backend** middleware `permission:module,action`.
2. **KHÔNG fallback "any club"** khi `clubId = null`. `null` = system scope, `int` = club scope. 2 scope KHÔNG mix.
3. **Module slug (`club`, `user`) và club key (`club_1`, `club_2`) KHÔNG collide** — module slug không có prefix `club_`.
4. **Test 3 shape**: superadmin (`["*"]`), admin (flat), club user (nested `club_{id}`). Nếu response ra array tuần tự `[{...},{...}]` → backend chưa cập nhật hoặc cache.
5. **Helper `can()` duy nhất** — không tự implement check permission rải rác ở component.
