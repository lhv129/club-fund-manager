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

/**
 * Format thời gian tương đối ("5 phút trước", "3 hours ago").
 * Dùng Intl.RelativeTimeFormat — tự bản địa hóa theo locale.
 */
export function formatAgo(
  iso: string | null | undefined,
  locale: string = "vi",
): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (isNaN(diffMs)) return "—";

  const rtf = new Intl.RelativeTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { numeric: "auto" },
  );
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return rtf.format(0, "minute");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (minutes < 1440) return rtf.format(-Math.floor(minutes / 60), "hour");
  if (minutes < 43_200) return rtf.format(-Math.floor(minutes / 1440), "day");
  if (minutes < 525_600)
    return rtf.format(-Math.floor(minutes / 43_200), "week");
  return rtf.format(-Math.floor(minutes / 525_600), "year");
}