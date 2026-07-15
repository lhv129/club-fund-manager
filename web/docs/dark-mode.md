# Quy chuẩn quản lý màu sắc và Dark Mode

## Mục tiêu

Để giao diện dễ bảo trì, hỗ trợ Dark Mode và có thể thay đổi màu chủ đạo (Primary Color) cho toàn bộ hệ thống, **không sử dụng trực tiếp các màu như `text-zinc-900`, `bg-gray-100`, `text-black`,... trong component**.

Thay vào đó, toàn bộ component sẽ sử dụng **Semantic Design Tokens** được khai báo trong `globals.css`.

---

# 1. Design Tokens

## Light Mode

```css
:root {
  --background: #ffffff;
  --foreground: #171717;

  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-foreground: #ffffff;

  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-700: #1d4ed8;
}
```

---

## Dark Mode

Dark Mode không sử dụng màu đen tuyệt đối (`#000000` hoặc `#0a0a0a`) vì:

* gây mỏi mắt
* độ tương phản quá cao
* card và background bị hòa vào nhau

Thay vào đó sử dụng palette xám đậm.

```css
.dark {
  --background: #111827;
  --background-subtle: #1f2937;
  --background-muted: #374151;

  --foreground: #f9fafb;
  --foreground-muted: #9ca3af;

  --primary: #60a5fa;
  --primary-foreground: #ffffff;

  --primary-50: #1e3a5f;
  --primary-100: #1e40af33;
  --primary-700: #93c5fd;
}
```

---

# 2. Mapping sang Tailwind

Sử dụng `@theme inline` để map CSS Variables thành Tailwind Utilities.

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);

  --color-background-subtle: var(--background-subtle);
  --color-background-muted: var(--background-muted);

  --color-foreground-muted: var(--foreground-muted);
}
```

Sau khi mapping có thể dùng trực tiếp:

```tsx
bg-background
text-foreground

bg-primary
text-primary

text-foreground-muted

bg-background-subtle
bg-background-muted
```

---

# 3. Quy tắc sử dụng màu

## ❌ Không nên

Hardcode màu trong component.

```tsx
<h1 className="text-zinc-900">

<p className="text-zinc-500">

<div className="bg-white">

<div className="bg-gray-100">
```

Những màu này sẽ không tự đổi khi chuyển Dark Mode.

---

## ✅ Nên

Luôn sử dụng semantic color.

```tsx
<h1 className="text-fg">

<p className="text-fg-muted">

<div className="bg-background">

<div className="bg-background-subtle">
```

Lợi ích:

* Light/Dark tự đổi
* Không phải sửa component
* Theme đồng bộ

---

# 4. Primary Color

Primary Color chỉ được định nghĩa một lần.

```css
--primary: #2563eb;
```

Component sử dụng:

```tsx
<button className="bg-primary text-primary-foreground">

<a className="text-primary">

<div className="border-primary">
```

Nếu đổi:

```css
--primary: #dc2626;
```

Toàn bộ hệ thống sẽ chuyển sang màu đỏ mà không cần sửa component.

---

# 5. Màu trạng thái (Status Colors)

Các màu trạng thái (Success, Warning, Danger...) được phép sử dụng trực tiếp vì mang ý nghĩa nghiệp vụ.

Ví dụ:

```tsx
text-emerald-500
bg-emerald-500/10

text-amber-500
bg-amber-500/10

text-red-500
bg-red-500/10

text-blue-500
bg-blue-500/10
```

Đây là các màu biểu thị trạng thái nên không phụ thuộc Primary Color.

---

# 6. Dashboard Cards

Dashboard sử dụng icon của `lucide-react` thay cho Emoji.

Ví dụ:

```tsx
const STATS = [
  {
    key: "totalUsers",
    icon: Users,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    key: "totalClubs",
    icon: Building2,
    color: "text-violet-500 bg-violet-500/10",
  },
];
```

Tiêu đề và nội dung sử dụng semantic colors.

```tsx
<h1 className="text-fg">

<p className="text-fg-muted">

<p className="text-fg font-bold">
```

Thay vì:

```tsx
text-zinc-900
text-zinc-500
```

---

# 7. Card Component

Card không nên hardcode màu.

Thay vì:

```tsx
bg-white
border-gray-200
```

nên dùng:

```tsx
bg-background-subtle
border-border
```

hoặc các semantic token tương ứng của dự án.

Nhờ đó Card sẽ tự hiển thị đúng ở cả Light và Dark Mode.

---

# 8. Checklist khi phát triển UI

* Không hardcode `text-zinc-*`, `bg-gray-*`, `text-black`, `bg-white` trong component.
* Sử dụng semantic colors (`text-fg`, `text-fg-muted`, `bg-background`, `bg-background-subtle`,...).
* Primary Color chỉ khai báo tại `globals.css`.
* Component chỉ sử dụng `bg-primary`, `text-primary`, `border-primary`.
* Dark Mode chỉ thay đổi CSS Variables, không sửa từng component.
* Màu trạng thái (Success, Warning, Danger, Info) được phép dùng trực tiếp.
* Icon ưu tiên sử dụng `lucide-react` thay cho Emoji.

---

# Lợi ích

* Hỗ trợ Light/Dark Mode tự động.
* Thay đổi Primary Color cho toàn bộ hệ thống chỉ bằng một vị trí.
* Component không phụ thuộc vào màu cụ thể.
* Giao diện đồng nhất và dễ mở rộng.
* Giảm đáng kể chi phí bảo trì khi thay đổi giao diện trong tương lai.
