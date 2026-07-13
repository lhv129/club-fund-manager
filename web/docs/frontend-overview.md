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
│   │   ├── dashboard/                  # ⬅ Dashboard workspace (system) — URL: /{locale}/dashboard/...
│   │   │   ├── layout.tsx          # Auth guard + fetch profile + DashboardShell (KHÔNG permission gate)
│   │   │   ├── clubs/page.tsx      # Danh sách CLB (chọn CLB để vào workspace) — mọi user đã login
│   │   │   ├── no-club/page.tsx    # Trang "Chưa có CLB" — tìm CLB / nhập token để xin vào
│   │   │   └── (system)/           # Route group — system pages (CÓ permission gate)
│   │   │       ├── layout.tsx      # Gate: superadmin hoặc có view user/role/permission
│   │   │       ├── page.tsx        # /dashboard — dashboard hệ thống (stats)
│   │   │       ├── users/page.tsx
│   │   │       ├── roles/page.tsx
│   │   │       ├── permissions/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   └── club/                   # ⬅ Club workspace — URL: /{locale}/club/{slug}/...
│   │       └── [slug]/
│   │           ├── layout.tsx      # Auth + fetch profile + fetch club by slug + permission gate theo club.id
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
│   ├── club/                       # types, services (Club, Member, Invite), stores, hooks
│   │   ├── types/index.ts          # Club, ClubMember, ClubInvite, Translation
│   │   ├── services/               # clubService (client), clubServiceServer, clubMemberService, clubInviteService
│   │   ├── stores/clubStore.ts     # zustand — club workspace hiện tại
│   │   ├── hooks/useClub.ts       # useClub() + useHydrateClub()
│   │   ├── ClubsPageClient.tsx    # Danh sách CLB (dashboard) + nút "Mở workspace"
│   │   └── NoClubClient.tsx       # Trang "Chưa có CLB" — search/token join
│   ├── role/
│   ├── permission/
│   └── module/
│
├── components/
│   ├── ui/                         # Button, Input, Card, DashboardTable, DashboardFilterBar, DashboardPagination
│   ├── layout/
│   │   ├── DashboardShell.tsx          # Wrap Sidebar (system) + Header + main
│   │   ├── ClubShell.tsx           # Wrap ClubSidebar + Header + main
│   │   ├── Sidebar.tsx             # System sidebar (dùng ADMIN_NAV_ITEMS)
│   │   ├── ClubSidebar.tsx         # Club sidebar (dùng CLUB_NAV_ITEMS, scope theo club.id)
│   │   ├── Header.tsx              # Menu toggle + LocaleSwitcher + AvatarDropdown
│   │   ├── nav-config.ts          # ADMIN_NAV_ITEMS + filterNav + findNavTrail
│   │   └── club-nav-config.ts     # CLUB_NAV_ITEMS (sub-route + module/action)
│   ├── FormModal.tsx               # Modal form JSON — hỗ trợ translatableFields
│   ├── FormModalWithMedia.tsx      # Modal form FormData (có ảnh/media)
│   ├── DeleteConfirmModal.tsx
│   └── LocaleSwitcher.tsx          # Đổi locale — tự dịch slug nếu đang ở club route
│
├── hooks/
│   └── useDashboardListParams.ts       # Hook quản lý filter/sort/page/limit — generic theo module
│
├── lib/
│   ├── http/
│   │   ├── types.ts                # HttpAdapter interface
│   │   ├── queryString.ts          # buildQueryString
│   │   ├── serverAdapter.ts        # Server-only — đọc cookie, Bearer token, AUTO-REFRESH 401
│   │   └── browserAdapter.ts      # Client-safe — gọi qua /api/proxy
│   ├── baseRepository.ts           # Abstract class — toàn bộ CRUD viết 1 lần
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

2. Hai workspace — chia theo role
┌─────────────────┬────────────────────────────────────────────────────────────┐
│ Super Dashboard     │ /dashboard (system: clubs, users, roles, permissions, settings) │
│                 │     ↓ chọn CLB                                              │
│                 │ /club/{slug}/dashboard (workspace CLB: members, invites...) │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Club Manager    │ /dashboard/clubs (chọn CLB của mình)                             │
│                 │     ↓ chọn CLB                                              │
│                 │ /club/{slug}/dashboard                                     │
│                 │ Không thấy system pages (users/roles/permissions) — ẩn theo │
│                 │ permission. Sidebar club có nút "← Quay lại danh sách CLB"  │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Member          │ /club/{slug}/dashboard (vào thẳng nếu chỉ 1 CLB)             │
│                 │ Sidebar ít hơn (dashboard, members, events...)              │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Chưa có CLB     │ /dashboard/no-club — tìm CLB hoặc nhập invite token              │
└─────────────────┴────────────────────────────────────────────────────────────┘

3. Data flow
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

4. Auth — refresh token tự động
- Token trong httpOnly cookie (access_token 1h, refresh_token 7d).
- serverAdapter: request trả 401 → gọi Laravel /auth/refresh bằng refresh_token
  → set cookie mới qua cookies().set() → retry request gốc 1 lần.
- Client Component qua /api/proxy cũng hưởng auto-refresh (proxy dùng serverAdapter).
- Refresh thất bại (refresh_token hết hạn) → trả 401 → layout redirect /login.

5. Locale — nguồn duy nhất + dịch slug
- Chỉ sửa src/config/locales.json khi thêm/bớt ngôn ngữ.
- lib/locales.ts export: LOCALES, LOCALE_CODES, DEFAULT_LOCALE, FALLBACK_LOCALE.
- URL dùng slug theo locale: /vi/club/cau-lac-bo-ha-noi ↔ /en/club/hanoi-badminton-club
- Backend resolve club qua club_translations.slug + locale.
- LocaleSwitcher: khi đổi locale, nếu đang ở /club/{slug}/... → tìm slug mới trong
  club.translations (đã hydrate từ store) → đổi URL, KHÔNG gọi API.

6. Login redirect
Sau login thành công:
  - is_superadmin                   → /dashboard
  - 1 club truy cập được            → /club/{slug}/dashboard
  - 2+ clubs                        → /dashboard/clubs
  - 0 club / lỗi fetch              → /dashboard/no-club
