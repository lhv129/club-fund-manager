/**
 * Utility: merge class names conditionally.
 * Simple clsx alternative — no extra dependency needed.
 */
export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/** Format ISO date string to localized display. */
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

/** Format ISO datetime to localized display. */
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
