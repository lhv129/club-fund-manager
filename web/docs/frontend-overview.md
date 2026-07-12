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
│   │   └── (dashboard)/            # Route group — protected
│   │       ├── layout.tsx          # Auth guard + fetch profile (server)
│   │       ├── page.tsx            # Dashboard "/"
│   │       ├── users/page.tsx
│   │       ├── roles/page.tsx
│   │       ├── permissions/page.tsx
│   │       ├── clubs/page.tsx
│   │       ├── club-members/page.tsx
│   │       ├── club-invites/page.tsx
│   │       └── settings/page.tsx
│   └── api/
│       ├── auth/                   # Route Handlers — quản lý httpOnly cookie
│       │   ├── login/route.ts
│       │   ├── refresh/route.ts
│       │   └── logout/route.ts
│       └── proxy/[...path]/route.ts # Generic proxy — Client Component gọi API qua đây
│
├── domains/                        # Domain-driven — mirror backend
│   ├── auth/                       # types, services (server + client), stores, hooks
│   ├── user/
│   ├── club/                       # types, services (Club, Member, Invite) — có translations
│   ├── role/
│   ├── permission/
│   └── module/
│
├── components/
│   ├── ui/                         # Button, Input, Card, Badge, Spinner
│   │   └── AdminTable.tsx          # Bảng generic — nhận data/columns
│   ├── admin/                      # AdminFilterBar, AdminPagination (generic, dùng useAdminListParams)
│   ├── layout/                     # Sidebar, Header, DashboardShell, LocaleSwitcher
│   ├── FormModal.tsx               # Modal form JSON — hỗ trợ translatableFields
│   └── FormModalWithMedia.tsx      # Modal form FormData (có ảnh/media) — hỗ trợ translatableFields
│
├── hooks/
│   └── useAdminListParams.ts       # Hook quản lý filter/sort/page/limit — generic theo module
│
├── lib/
│   ├── http/
│   │   ├── types.ts                # HttpAdapter interface
│   │   ├── queryString.ts          # buildQueryString — dùng chung cả 2 adapter
│   │   ├── serverAdapter.ts        # Server-only — đọc cookie, gắn Bearer token, gọi Laravel trực tiếp
│   │   └── browserAdapter.ts       # Client-safe — gọi qua /api/proxy, gắn Accept-Language
│   ├── baseRepository.ts           # Abstract class duy nhất — toàn bộ CRUD method viết 1 lần
│   ├── cookies.ts                  # httpOnly cookie helpers (server-only)
│   ├── config.ts                   # API_URL, APP_URL
│   ├── locales.ts                  # Nguồn locale duy nhất — đọc config/locales.json
│   └── formTranslations.ts         # Parse lỗi validate + khởi tạo giá trị cho field đa ngôn ngữ
│
├── config/
│   └── locales.json                # Danh sách locale — SỬA FILE NÀY khi thêm/bớt ngôn ngữ
│
├── i18n/
│   ├── routing.ts                  # LOCALE_CODES (từ lib/locales) + pathnames + navigation
│   └── request.ts                  # next-intl request config
│
├── messages/                       # i18n messages UI
│   ├── vi.json
│   └── en.json
│
├── types/api.ts                    # ApiResponse, PaginatedResponse, CursorResponse
├── constants/index.ts              # Routes, cookie names, permission slugs
├── providers/index.ts
└── utils/index.ts

2. Data flow
SERVER (Server Component, Route Handler)
    page/layout.tsx
        ↓
    xxxService.ts   (extends BaseRepository, adapter = serverAdapter)
        ↓
    lib/baseRepository.ts
        ↓
    lib/http/serverAdapter.ts  ── cookies() + Bearer token ──▶  Laravel API
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

Proxy route dùng createServerAdapter(locale) — forward Accept-Language từ browser request thay vì gọi getLocale() (vì URL /api/proxy/... không có locale prefix).

3. Locale — nguồn duy nhất
Chỉ sửa src/config/locales.json khi thêm/bớt ngôn ngữ:

{
  "defaultLocale": "vi",
  "locales": [
    { "code": "vi", "label": "Tiếng Việt", "flag": "/icon/flag-for-flag-vietnam.svg" },
    { "code": "en", "label": "English",    "flag": "/icon/flag-for-flag-united-kingdom.svg" }
  ]
}

lib/locales.ts export: LOCALES, LOCALE_CODES, DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALE_PATH_REGEX — toàn bộ code đọc từ đây, không hardcode locale ở bất kỳ chỗ nào khác.