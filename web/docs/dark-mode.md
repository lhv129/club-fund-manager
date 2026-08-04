# Quy chuẩn quản lý màu sắc và Dark Mode

## Mục tiêu

Toàn bộ giao diện phải sử dụng **Semantic Design Tokens** được khai báo trong `globals.css`.

Mục tiêu:

- Hỗ trợ Light Mode và Dark Mode tự động.
- Thay đổi Primary Color cho toàn bộ hệ thống tại một vị trí.
- Component không phụ thuộc vào màu cụ thể.
- Giảm chi phí bảo trì khi thay đổi giao diện.
- Đảm bảo tính đồng nhất của UI.

---

# 1. Design Tokens

## Light Mode

```css
:root {
  /* Background */
  --background: #ffffff;
  --background-subtle: #f8fafc;
  --background-muted: #f1f5f9;

  /* Foreground */
  --foreground: #171717;
  --foreground-muted: #71717a;

  /* Border */
  --border: #e4e4e7;

  /* Primary */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-foreground: #ffffff;

  /* Primary Scale */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-700: #1d4ed8;
}
```

---

## Dark Mode

Dark Mode sử dụng palette xám đậm thay vì màu đen tuyệt đối để:

- Giảm mỏi mắt.
- Giảm độ tương phản quá cao.
- Tạo sự phân tầng giữa background, card và sidebar.

```css
.dark {
  /* Background */
  --background: #111827;
  --background-subtle: #1f2937;
  --background-muted: #374151;

  /* Foreground */
  --foreground: #f9fafb;
  --foreground-muted: #9ca3af;

  /* Border */
  --border: #374151;

  /* Primary */
  --primary: #60a5fa;
  --primary-hover: #3b82f6;
  --primary-foreground: #ffffff;

  /* Primary Scale */
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
  /* Background */
  --color-background: var(--background);
  --color-background-subtle: var(--background-subtle);
  --color-background-muted: var(--background-muted);

  /* Foreground */
  --color-foreground: var(--foreground);
  --color-foreground-muted: var(--foreground-muted);

  /* Border */
  --color-border: var(--border);

  /* Primary */
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);
}
```

---

# 3. Semantic Colors

Component chỉ sử dụng Semantic Colors.

```tsx
/* Background */
bg-background
bg-background-subtle
bg-background-muted

/* Foreground */
text-foreground
text-foreground-muted

/* Border */
border-border

/* Primary */
bg-primary
text-primary
text-primary-foreground
border-primary
hover:bg-primary-hover
```

Dark Mode được xử lý hoàn toàn bằng CSS Variables.

Component không cần quan tâm Light Mode hay Dark Mode.

---

# 4. Primary Color

Primary Color chỉ được định nghĩa tại `globals.css`.

```css
--primary: #2563eb;
```

Component sử dụng:

```tsx
<button className="bg-primary text-primary-foreground">

<a className="text-primary">

<div className="border-primary">
```

Khi thay đổi:

```css
--primary: #dc2626;
```

Toàn bộ hệ thống sẽ tự động cập nhật.

---

# 5. Status Colors

Các màu trạng thái được phép sử dụng trực tiếp vì mang ý nghĩa nghiệp vụ.

Ví dụ:

```tsx
/* Success */
text-emerald-500
bg-emerald-500/10

/* Warning */
text-amber-500
bg-amber-500/10

/* Danger */
text-red-500
bg-red-500/10

/* Info */
text-blue-500
bg-blue-500/10
```

Các màu này không phụ thuộc Primary Color.

---

# 6. Checklist

Khi phát triển UI:

- Chỉ sử dụng Semantic Design Tokens.
- Primary Color chỉ khai báo trong `globals.css`.
- Dark Mode chỉ thay đổi CSS Variables.
- Component không phụ thuộc Light/Dark Mode.
- Status Colors được phép sử dụng trực tiếp.
- Icon ưu tiên `lucide-react`.

---

# Lợi ích

- Hỗ trợ Light/Dark Mode tự động.
- Đổi Theme dễ dàng.
- Component không phụ thuộc màu cụ thể.
- Giao diện đồng nhất.
- Dễ bảo trì và mở rộng.
- Giảm chi phí thay đổi UI trong tương lai.