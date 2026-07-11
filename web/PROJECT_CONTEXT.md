# Next.js Frontend — Club Fund Manager

> **Stack**: Next.js 16, React 19, TypeScript, Tailwind v4, next-intl, zustand

---

## 1. Cấu trúc thư mục

```text
src/
├── app/
│   ├── layout.tsx                  # Root layout — <html>/<body> + fonts
│   ├── globals.css
│   ├── [locale]/                   # Locale prefix (vi/en)
│   │   ├── layout.tsx              # NextIntlClientProvider
│   │   ├── not-found.tsx
│   │   ├── (auth)/                 # Route group — login/register
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx  # /vi/login | /en/login
│   │   │   └── register/page.tsx
│   │   └── (dashboard)/            # Route group — protected
│   │       ├── layout.tsx          # Auth guard + fetch profile
│   │       ├── page.tsx            # Dashboard "/"
│   │       ├── users/page.tsx
│   │       ├── roles/page.tsx
│   │       ├── permissions/page.tsx
│   │       ├── clubs/page.tsx
│   │       ├── club-members/page.tsx
│   │       ├── club-invites/page.tsx
│   │       └── settings/page.tsx
│   └── api/auth/                   # Route Handlers — quản lý httpOnly cookie
│       ├── login/route.ts
│       ├── refresh/route.ts
│       └── logout/route.ts
│
├── domains/                        # Domain-driven — mirror backend
│   ├── auth/                       # types, services, stores, hooks, components
│   ├── user/                       # types, services
│   ├── club/                       # types, services (Club, Member, Invite)
│   ├── role/
│   ├── permission/
│   └── module/
│
├── components/
│   ├── ui/                         # Button, Input, Card, Badge, Spinner
│   └── layout/                     # Sidebar, Header, DashboardShell, LocaleSwitcher
│
├── lib/
│   ├── apiClient.ts                # Fetch wrapper (server-only)
│   ├── baseService.ts              # Base CRUD (server-only)
│   ├── cookies.ts                  # httpOnly cookie helpers (server-only)
│   └── errors.ts                   # ApiError class
│
├── i18n/
│   ├── routing.ts                  # Locales + pathnames + navigation
│   └── request.ts                  # next-intl request config
│
├── messages/                       # i18n messages
│   ├── vi.json
│   └── en.json
│
├── types/api.ts                    # ApiResponse, PaginatedResponse, CursorResponse
├── constants/index.ts              # Routes, cookie names, permission slugs
├── providers/index.ts              # Context providers (placeholder)
└── utils/index.ts                  # cn(), formatDate()
```

---

## 2. Kiến trúc

```text
Server Component (page/layout)
    ↓
apiClient / BaseService           ← đọc httpOnly cookie, gọi Laravel API
    ↓
Route Handler (/api/auth/*)       ← set/clear cookie, không lộ token ra client
    ↓
Client Component (form, sidebar)
    ↓
authService (client-safe)          ← gọi Route Handler qua fetch
    ↓
useAuth hook (zustand store)       ← quản lý state client
```

### Phân tách Server vs Client

| File | Chạy ở | Lý do |
|---|---|---|
| `lib/apiClient.ts` | Server only | Đọc cookie qua `next/headers` |
| `lib/baseService.ts` | Server only | Dùng apiClient |
| `lib/cookies.ts` | Server only | Dùng `next/headers` |
| `domains/*/services/*Service.ts` | Server only | Extend BaseService |
| `domains/auth/services/authService.ts` | Client safe | Gọi Route Handler qua fetch |
| `domains/auth/services/authServiceServer.ts` | Server only | Gọi apiClient trực tiếp |

---

## 3. Auth — JWT qua httpOnly Cookie

```
Login → Route Handler set cookie → Client chỉ nhận { user }
Request → apiClient đọc cookie → Authorization: Bearer
401 → Route Handler refresh → rotate cookie → retry
Logout → Route Handler clear cookie
```

Token **không bao giờ** lộ ra client JS.

---

## 4. i18n — next-intl

- Locales: `vi` (default), `en`
- Path prefix: `always` → `/vi/login`, `/en/login`
- Messages: `src/messages/{locale}.json`
- Thêm key mới → cập nhật cả `vi.json` + `en.json`

---

## 5. Thêm module mới

1. Tạo `src/domains/{module}/types/index.ts` — interface khớp backend Resource
2. Tạo `src/domains/{module}/services/{Module}Service.ts` — extends `BaseService<T>`
3. Tạo `src/app/[locale]/(dashboard)/{module}/page.tsx` — Server Component
4. Thêm route vào `src/i18n/routing.ts` pathnames
5. Thêm menu item vào `src/components/layout/Sidebar.tsx`
6. Thêm translation key vào `src/messages/vi.json` + `en.json`

---

## 6. Lệnh

```bash
npm run dev      # Dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

---

## 7. Biến môi trường (`.env.local`)

```
API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME="Club Fund Manager"
```
