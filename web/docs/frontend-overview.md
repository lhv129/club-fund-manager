Next.js Frontend — Club Fund Manager
Stack: Next.js 16, React 19, TypeScript, Tailwind v4, next-intl, zustand

1. Cấu trúc thư mục
src/
├── app/
│   ├── layout.tsx                  # Root layout — <html>/<body> + fonts
│   ├── globals.css
│   ├── [locale]/                   # Locale prefix (vi/en)
│   │   ├── layout.tsx              # NextIntlClientProvider
│   │   ├── not-found.tsx
│   │   ├── (auth)/                 # Route group — login/register
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── admin/                  # ⬅ Admin workspace (system) — URL: /{locale}/admin/...
│   │   │   ├── layout.tsx          # Auth guard + fetch profile + AdminShell (KHÔNG permission gate)
│   │   │   ├── clubs/page.tsx      # Danh sách CLB (chọn CLB để vào workspace) — mọi user đã login
│   │   │   ├── no-club/page.tsx    # Trang "Chưa có CLB" — tìm CLB / nhập token để xin vào
│   │   │   └── (system)/           # Route group — system pages (CÓ permission gate)
│   │   │       ├── layout.tsx      # Gate: superadmin / is_system_admin / có system permission
│   │   │       ├── page.tsx        # /admin — dashboard hệ thống (stats)
│   │   │       ├── users/page.tsx
│   │   │       ├── roles/page.tsx
│   │   │       ├── permissions/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   └── club/                   # ⬅ Club workspace — URL: /{locale}/club/{slug}/...
│   │       └── [slug]/
│   │           ├── layout.tsx      # Auth + fetch profile + fetch club by slug + canAccessClub gate
│   │           ├── dashboard/page.tsx
│   │           ├── members/page.tsx
│   │           ├── invites/page.tsx
│   │           └── settings/page.tsx
│   │
│   └── api/
│       ├── auth/                   # Route Handlers — quản lý httpOnly cookie
│       │   ├── login/route.ts
│       │   ├── refresh/route.ts
│       │   └── logout/route.ts
│       └── proxy/[...path]/route.ts # Generic proxy — Client Component gọi API qua đây
│
├── domains/                        # Domain-driven — mirror backend
│   ├── auth/                       # types, services (server + client), stores, hooks
│   │   ├── types/index.ts          # Profile (is_superadmin, is_system_admin, permissions: PermissionMap)
│   │   ├── hooks/useAuth.ts       # hasPermission → can(); isSystemAdmin; canAccessClub; hasAnyClubPermission
│   │   ├── stores/authStore.ts    # zustand
│   │   └── services/              # authService (client), authServiceServer
│   ├── club/                       # types, services, stores, hooks
│   │   ├── types/index.ts          # Club, ClubMember, ClubInvite, Translation
│   │   ├── services/               # clubService (client), clubServiceServer, clubMemberService, clubInviteService
│   │   ├── stores/clubStore.ts     # zustand — club workspace hiện tại
│   │   ├── hooks/useClub.ts       # useClub() + useHydrateClub()
│   │   ├── ClubsPageClient.tsx    # Danh sách CLB (admin) + nút "Mở workspace"
│   │   └── NoClubClient.tsx       # Trang "Chưa có CLB" — search/token join
│   ├── role/
│   ├── permission/
│   └── module/
│
├── components/
│   ├── ui/                         # Button, Input, Card, AdminTable, AdminFilterBar, AdminPagination
│   ├── layout/
│   │   ├── AdminShell.tsx          # Wrap Sidebar (system) + Header + main
│   │   ├── ClubShell.tsx           # Wrap ClubSidebar + Header + main
│   │   ├── Sidebar.tsx             # System sidebar — DASHBOARD_NAV_ITEMS, isSuperAdmin||isSystemAdmin
│   │   ├── ClubSidebar.tsx         # Club sidebar — CLUB_NAV_ITEMS, scope theo club.id
│   │   ├── Header.tsx              # Menu toggle + LocaleSwitcher + AvatarDropdown
│   │   ├── nav-config.ts          # DASHBOARD_NAV_ITEMS + filterNav + findNavTrail
│   │   └── club-nav-config.ts     # CLUB_NAV_ITEMS (sub-route + module/action)
│   ├── FormModal.tsx               # Modal form JSON — hỗ trợ translatableFields
│   ├── FormModalWithMedia.tsx      # Modal form FormData (có ảnh/media)
│   ├── DeleteConfirmModal.tsx
│   └── LocaleSwitcher.tsx          # Đổi locale — tự dịch slug nếu đang ở club route
│
├── hooks/
│   └── useAdminListParams.ts       # Hook quản lý filter/sort/page/limit — generic theo module
│
├── lib/
│   ├── http/
│   │   ├── types.ts                # HttpAdapter interface
│   │   ├── queryString.ts          # buildQueryString
│   │   ├── serverAdapter.ts        # Server-only — cookie Bearer, AUTO-REFRESH 401
│   │   └── browserAdapter.ts      # Client-safe — gọi qua /api/proxy
│   ├── baseRepository.ts           # Abstract class — toàn bộ CRUD viết 1 lần
│   ├── permissions.ts              # ⬅ can(), canAccessClub(), hasAnyClubPermission(), systemPermissions(), ...
│   ├── cookies.ts                  # httpOnly cookie helpers (server-only)
│   ├── config.ts                   # API_URL, APP_URL
│   ├── errors.ts                   # ApiError
│   ├── locales.ts                  # Nguồn locale duy nhất — đọc config/locales.json
│   └── formTranslations.ts         # Parse lỗi validate + khởi tạo field đa ngôn ngữ
│
├── config/
│   └── locales.json                # Danh sách locale — SỬA FILE NÀY khi thêm/bớt ngôn ngữ
│
├── i18n/
│   ├── routing.ts                  # locales + navigation (Link, useRouter, usePathname, ...)
│   └── request.ts                  # next-intl request config
│
├── messages/                       # i18n messages UI
│   ├── vi.json
│   └── en.json
│
├── types/api.ts                    # ApiResponse, PaginatedResponse, CursorResponse
├── constants/index.ts              # APP_ROUTES, CLUB_SUBROUTES, clubRoute(), MODULE_SLUGS, ...
├── providers/index.ts
└── utils/index.ts

2. Permission — 5 role & 2 scope (xem docs/permission-guide.md)
┌─────────────┬──────────────────┬──────────────────┬───────────────────────────────────────┐
│ Role        │ is_superadmin    │ is_system_admin  │ Shape permissions                     │
├─────────────┼──────────────────┼──────────────────┼───────────────────────────────────────┤
│ superadmin  │ true             │ false            │ ["*"]                                 │
│ admin       │ false            │ true             │ { module: [actions] }  (flat, system) │
│ owner       │ false            │ false            │ { "club_{id}": { module: [...] } }    │
│ manager     │ false            │ false            │ { "club_{id}": { module: [...] } }    │
│ member      │ false            │ false            │ { "club_{id}": { module: [...] } }    │
└─────────────┴──────────────────┴──────────────────┴───────────────────────────────────────┘
Hybrid: admin + member của club X → merge shape 2+3 (không collide vì module slug ≠ `club_{id}`).

- 2 scope: system (users/roles/permissions/...) | club (members/funds/transactions/...)
- 1 user thuộc nhiều club với role khác nhau per-club.
- Helper `can(perms, isSuperAdmin, module, action, clubId)` duy nhất — clubId null = system scope, number = club scope.
- KHÔNG fallback "any club" khi clubId null.

3. Hai workspace — chia theo role
┌─────────────────┬────────────────────────────────────────────────────────────┐
│ Super Admin     │ /admin (system: clubs, users, roles, permissions, settings) │
│                 │     ↓ chọn CLB                                              │
│                 │ /club/{slug}/dashboard (workspace CLB: members, invites...) │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Admin (system)  │ /admin — nav theo quyền SA cấp (không bypass)                │
│                 │ Hybrid: cũng vào được /club/{slug}/... nếu là member club đó │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Owner/Manager   │ /admin/clubs (chọn CLB của mình)                             │
│                 │     ↓ chọn CLB                                              │
│                 │ /club/{slug}/dashboard — sidebar đầy đủ/giảm theo quyền     │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Member          │ /club/{slug}/dashboard (vào thẳng nếu chỉ 1 CLB)             │
│                 │ Sidebar ít nhất — chỉ view                                  │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Chưa có CLB     │ /admin/no-club — tìm CLB hoặc nhập invite token              │
└─────────────────┴────────────────────────────────────────────────────────────┘

4. Gate pattern 3 tầng
Tầng 1 — Layout gate (Server Component):
  - admin/layout.tsx           → chỉ auth + fetch profile (KHÔNG gate)
  - admin/(system)/layout.tsx  → superadmin | is_system_admin | có system permission
  - club/[slug]/layout.tsx     → canAccessClub(permissions, isSuperAdmin, club.id)

Tầng 2 — Nav filter (Client Component):
  - Sidebar.tsx       → filterNav(DASHBOARD_NAV_ITEMS, (m,a) => hasPermission(m, a), isSuperAdmin||isSystemAdmin)
                        (clubId undefined → SYSTEM SCOPE)
  - ClubSidebar.tsx   → CLUB_NAV_ITEMS.filter(item => hasPermission(item.module, item.action, club.id))
                        (clubId = club.id → CLUB SCOPE)
                        showBackToClubs = isSuperAdmin || hasAnyClubPermission()

Tầng 3 — Page & Button gate (Client Component):
  - Page:   if (!hasPermission("member", "view", club.id)) return <Forbidden/>
  - Button: {hasPermission("member", "create", club.id) && <Button/>}
  - System: if (!isSuperAdmin && !hasPermission("user", "view")) return <Forbidden/>

5. Data flow
SERVER (Server Component, Route Handler)
    page/layout.tsx
        ↓
    xxxServiceServer.ts   (extends BaseRepository, adapter = serverAdapter)
        ↓
    lib/baseRepository.ts
        ↓
    lib/http/serverAdapter.ts  ── cookie Bearer token ──▶  Laravel API
                                     ↑ 401? tự refresh + retry 1 lần (cookie set lại)

CLIENT (Client Component — "use client")
    XxxPageClient.tsx / FormModal / useAuth
        ↓
    xxxService.client.ts   (extends BaseRepository, adapter = browserAdapter)
        ↓
    lib/baseRepository.ts
        ↓
    lib/http/browserAdapter.ts  ── Accept-Language ──▶  /api/proxy/[...path]
                                                              ↓
                                                    createServerAdapter(locale)
                                                              ↓
                                                    lib/http/serverAdapter.ts ──▶ Laravel API
                                                    (401 cũng được auto-refresh tại đây)

6. Auth — refresh token tự động
- Token trong httpOnly cookie (access_token 1h, refresh_token 7d).
- serverAdapter: request trả 401 → gọi Laravel /auth/refresh bằng refresh_token
  → set cookie mới qua cookies().set() → retry request gốc 1 lần.
- Client Component qua /api/proxy cũng hưởng auto-refresh (proxy dùng serverAdapter).
- Refresh thất bại (refresh_token hết hạn) → trả 401 → layout redirect /login.

7. Locale — nguồn duy nhất + dịch slug
- Chỉ sửa src/config/locales.json khi thêm/bớt ngôn ngữ.
- lib/locales.ts export: LOCALES, LOCALE_CODES, DEFAULT_LOCALE, FALLBACK_LOCALE.
- URL dùng slug theo locale: /vi/club/cau-lac-bo-ha-noi ↔ /en/club/hanoi-badminton-club
- Backend resolve club qua club_translations.slug + locale.
- LocaleSwitcher: khi đổi locale, nếu đang ở /club/{slug}/... → tìm slug mới trong
  club.translations (đã hydrate từ store) → đổi URL, KHÔNG gọi API.

8. Login redirect
Sau login thành công:
  1. is_superadmin | is_system_admin    → /admin
  2. Đúng 1 club truy cập được          → /club/{slug}/dashboard
  3. 2+ clubs                           → /admin/clubs
  4. 0 club / lỗi fetch                 → /admin/no-club

9. Cheat sheet — hasPermission
const { hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();

// SYSTEM SCOPE (admin pages: users, roles, permissions, settings) — KHÔNG truyền clubId
hasPermission("user", "view");          // admin có user.view?
hasPermission("role", "create");        // admin có role.create?

// CLUB SCOPE (club workspace: members, funds, invites) — TRUYỀN club.id
hasPermission("member", "view", club.id);   // user có member.view ở club này?
hasPermission("fund", "create", club.id);   // user có fund.create ở club này?

// SUPERADMIN BYPASS → hasPermission() luôn true. KHÔNG cần check chi tiết.

// ❌ SAI: hasPermission("member", "view", null)  // null = system, không phải "any club"
// ❌ SAI: hasPermission("user", "view", club.id) // user là system module, không có club scope
