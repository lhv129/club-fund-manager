export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(
  iso: string | null | undefined,
  locale: string = "vi",
): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(
  iso: string | null | undefined,
  locale: string = "vi",
): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format số tiền sang dạng hiển thị, ví dụ: 250,000 đ */
export function formatAmount(
  value: string | number | null | undefined,
  currency: string = "đ",
  locale: string = "vi",
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "—";
  return (
    num.toLocaleString(locale === "vi" ? "vi-VN" : "en-US") + " " + currency
  );
}