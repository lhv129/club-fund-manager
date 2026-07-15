Next.js Frontend — Club Fund Manager
Stack: Next.js 16, React 19, TypeScript, Tailwind v4, next-intl, zustand

1. Cấu trúc thư mục
src/
├── app/
│   ├── layout.tsx                  # Root layout — <html>/<body> + fonts
│   ├── globals.css
│   ├── [locale]/                   # Locale prefix (vi/en)
│   │   ├── layout.tsx              # NextIntlClientProvider
│   │   ├── not-found.tsx           # 404 → href "/" (root)
│   │   ├── page.tsx                # ⬅ Root landing — phân luồng theo role (xem §8)
│   │   ├── (auth)/                 # Route group — login/register
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── admin/                  # ⬅ Admin workspace (system) — URL: /{locale}/admin/...
│   │   │   ├── layout.tsx          # Gate: superadmin | is_system_admin | có system permission
│   │   │   │                       #   → KHÔNG qua → redirect /{locale}/ (root phân luồng tiếp)
│   │   │   │                       #   → qua → render <AdminShell> (auth + profile hydrate)
│   │   │   └── (system)/           # Route group — system pages (gate chi tiết hơn)
│   │   │       ├── layout.tsx      # Gate: superadmin / is_system_admin / có system permission
│   │   │       │                   #   KHÔNG qua → redirect /{locale}/ (root)
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
│       │   ├── login/route.ts      # Chỉ set cookie + return JSON { user } — KHÔNG redirect
│       │   ├── refresh/route.ts
│       │   └── logout/route.ts
│       └── proxy/[...path]/route.ts # Generic proxy — Client Component gọi API qua đây
│
├── domains/                        # Domain-driven — mirror backend
│   ├── auth/                       # types, services (server + client), stores, hooks
│   │   ├── types/index.ts          # Profile (is_superadmin, is_system_admin, permissions: PermissionMap)
│   │   ├── hooks/useAuth.ts       # hasPermission → can(); isSystemAdmin; canAccessClub; hasAnyClubPermission
│   │   ├── stores/authStore.ts    # zustand
│   │   ├── services/              # authService (client), authServiceServer
│   │   └── components/LoginForm.tsx  # Chỉ login + redirect "/" — root page lo phân luồng
│   ├── club/                       # types, services, stores, hooks
│   │   ├── types/index.ts          # Club, ClubMember, ClubInvite, Translation
│   │   ├── services/               # clubService (client), clubServiceServer, clubMemberService, clubInviteService
│   │   ├── stores/clubStore.ts     # zustand — club workspace hiện tại
│   │   ├── hooks/useClub.ts       # useClub() + useHydrateClub()
│   │   ├── ClubsPageClient.tsx    # Danh sách CLB (nhận prop clubs từ root) + nút "Mở workspace"
│   │   └── NoClubClient.tsx       # Trang "Chưa có CLB" — search/token join (render tại root)
│   ├── role/
│   ├── permission/
│   └── module/
│
components/
├── shared/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── FormModal.tsx
│   │   └── FormModalWithMedia.tsx
│   ├── media/
│   │   ├── CustomImage.tsx
│   │   ├── MediaImage.tsx
│   │   └── MediaUploader.tsx
│   └── feedback/
│
├── admin/
│   ├── layout/
│   └── navigation/
│
├── club/
│   ├── layout/
│   └── navigation/
│
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
│   ├── permissions.ts              # ⬅ can(), canAccessClub(), hasAnyClubPermission(),
│   │                               #    hasAnySystemPermission(), systemPermissions(), ...
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
├── messages/                       # i18m messages UI
│   ├── vi.json
│   └── en.json
│
├── types/api.ts                    # ApiResponse, PaginatedResponse, CursorResponse
├── constants/index.ts              # APP_ROUTES (home, admin, adminUsers, ..., club),
│                                   #   CLUB_SUBROUTES, clubRoute(), MODULE_SLUGS, ...
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

3. Routing — root landing phân luồng + 2 workspace
Mọi user đã login đều đến root "/" trước. Root page (Server Component) fetch profile +
clubs, rồi phân luồng:

┌──────────────────┬──────────────────────────────────────────────────────────────┐
│ /{locale}/       │ Root landing (page.tsx) — phân luồng theo role:              │
│ (root)           │   1. Chưa login                     → /{locale}/login        │
│                  │   2. superadmin | is_system_admin   → /{locale}/admin       │
│                  │   3. 1 club truy cập được           → /{locale}/club/{slug}/│
│                  │                                       dashboard              │
│                  │   4. 2+ clubs                       → render <ClubsPageClient│
│                  │                                       clubs={...}/>           │
│                  │   5. 0 club                         → render <NoClubClient/> │
│                  │ Render trong <LandingShell> (Header, không sidebar).         │
├──────────────────┼──────────────────────────────────────────────────────────────┤
│ /{locale}/admin  │ Admin workspace (system: users, roles, permissions,          │
│                  │   settings, dashboard stats).                                 │
│                  │ Gate: superadmin | is_system_admin | có system permission.    │
│                  │ Hybrid admin cũng vào được (vì is_system_admin: true).        │
├──────────────────┼──────────────────────────────────────────────────────────────┤
│ /{locale}/club/  │ Club workspace (members, invites, funds, ...).               │
│   {slug}/...     │ Gate: canAccessClub(permissions, isSuperAdmin, club.id).     │
└──────────────────┴──────────────────────────────────────────────────────────────┘

KHÔNG còn route /admin/clubs và /admin/no-club — root "/" sở hữu danh sách CLB
và trang "Chưa có CLB".

4. Gate pattern 3 tầng
Tầng 1 — Layout gate (Server Component):
  - admin/layout.tsx           → auth + fetch profile + gate (superadmin | is_system_admin |
                                  hasAnySystemPermission). KHÔNG qua → redirect /{locale}/
                                  (root phân luồng tiếp). Qua → <AdminShell>.
  - admin/(system)/layout.tsx  → superadmin | is_system_admin | có system permission.
                                  KHÔNG qua → redirect /{locale}/ (root).
  - club/[slug]/layout.tsx     → canAccessClub(permissions, isSuperAdmin, club.id).
                                  KHÔNG qua → notFound().

Tầng 2 — Nav filter (Client Component):
  - Sidebar.tsx       → filterNav(ADMIN_NAV_ITEMS, (m,a) => hasPermission(m, a), isSuperAdmin||isSystemAdmin)
                        (clubId undefined → SYSTEM SCOPE)
  - ClubSidebar.tsx   → CLUB_NAV_ITEMS.filter(item => hasPermission(item.module, item.action, club.id))
                        (clubId = club.id → CLUB SCOPE)
                        showBackToClubs = isSuperAdmin || hasAnyClubPermission()
                        Nút "← Quay lại danh sách CLB" → href "/" (root phân luồng lại)

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
- Login route (POST /api/auth/login) CHỈ set cookie + return JSON { user }.
  KHÔNG có logic redirect ở server — LoginForm push về "/" và root page tự phân luồng.

7. Locale — nguồn duy nhất + dịch slug
- Chỉ sửa src/config/locales.json khi thêm/bớt ngôn ngữ.
- lib/locales.ts export: LOCALES, LOCALE_CODES, DEFAULT_LOCALE, FALLBACK_LOCALE.
- URL dùng slug theo locale: /vi/club/cau-lac-bo-ha-noi ↔ /en/club/hanoi-badminton-club
- Backend resolve club qua club_translations.slug + locale.
- LocaleSwitcher: khi đổi locale, nếu đang ở /club/{slug}/... → tìm slug mới trong
  club.translations (đã hydrate từ store) → đổi URL, KHÔNG gọi API.

8. Root landing — phân luồng sau login
Root page (src/app/[locale]/page.tsx) là Server Component, fetch profile + clubs rồi:
  1. Chưa login                        → /{locale}/login
  2. is_superadmin | is_system_admin   → /{locale}/admin
  3. Đúng 1 club truy cập được         → /{locale}/club/{slug}/dashboard
  4. 2+ clubs                          → render <ClubsPageClient clubs={...}/> (trong <LandingShell>)
  5. 0 club / lỗi fetch                → render <NoClubClient/> (trong <LandingShell>)

Login flow: LoginForm → login() → router.push("/") → root page tự phân luồng.
KHÔNG còn logic redirect 4-case trong LoginForm — tập trung ở root để dễ bảo trì.

ClubsPageClient nhận prop `clubs: Club[]` (đã lọc "của tôi" ở Server Component),
KHÔNG tự fetch. Vẫn giữ CRUD (create/edit/delete/toggle) — permission-gated qua
`hasPermission("club", "create"|"update"|"delete")` (system scope). Lưu ý: theo flow
mới, admin (is_system_admin) bị redirect thẳng /admin ở root nên không thấy
ClubsPageClient; chỉ club user 2+ clubs thấy trang này (không có system club permission
→ không thấy nút CRUD). Nếu sau cần UI quản lý club cho admin, thêm lại trang riêng.

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
