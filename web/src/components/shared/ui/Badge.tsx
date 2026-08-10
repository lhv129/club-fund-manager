// src/components/shared/ui/Badge.tsx
"use client";

// ─── Variant keys ──────────────────────────────────────────────────────────────
// Status:   active | inactive | locked
// Role:     super_admin | admin | member
// Priority: high | medium | low
// Type:     public | private
export type BadgeVariant =
  | "active"
  | "pending"
  | "inactive"
  | "locked"
  | "removed"
  | "super_admin"
  | "admin"
  | "member"
  | "high"
  | "medium"
  | "low"
  | "public"
  | "private"
  | "request"
  | "invite"
  | "role"
  | "scheduled"
  | "manual"
  | "upcoming"
  | "completed"
  | "cancelled";

interface BadgeProps {
  /** Key khai báo màu — không cần truyền màu thủ công */
  variant: BadgeVariant | string;
  /** Nhãn đã dịch: t("active"), t("roleAdmin"), ... */
  title?: string;
  className?: string;
  showDot?: boolean;
}

// ─── Map variant → style ────────────────────────────────────────────────────────
const CONFIG: Record<
  BadgeVariant,
  { dot: string; bg: string; text: string; ring: string }
> = {
  // Status
  // Monthly Contribution: paid
  active: {
    dot: "bg-emerald-700",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    ring: "ring-emerald-700/20",
  },

  // Monthly Contribution: pending
  pending: {
    dot: "bg-yellow-700",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    ring: "ring-yellow-700/20",
  },

  inactive: {
    dot: "bg-gray-400",
    bg: "bg-background-muted",
    text: "text-foreground-muted",
    ring: "ring-gray-500/20",
  },

  // Monthly Contribution: cancelled
  locked: {
    dot: "bg-red-600",
    bg: "bg-red-100",
    text: "text-red-600",
    ring: "ring-red-600/20",
  },

  removed: {
    dot: "bg-red-600",
    bg: "bg-red-100",
    text: "text-red-600",
    ring: "ring-red-600/20",
  },

  // Role
  super_admin: {
    dot: "bg-purple-500",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    ring: "ring-purple-500/20",
  },

  admin: {
    dot: "bg-indigo-500",
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/20",
  },

  member: {
    dot: "bg-blue-400",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
  },

  // Priority
  high: {
    dot: "bg-red-600",
    bg: "bg-red-100",
    text: "text-red-600",
    ring: "ring-red-600/20",
  },

  medium: {
    dot: "bg-yellow-700",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    ring: "ring-yellow-700/20",
  },

  low: {
    dot: "bg-emerald-700",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    ring: "ring-emerald-700/20",
  },

  // Data type
  public: {
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-500/20",
  },

  private: {
    dot: "bg-zinc-400",
    bg: "bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-400",
    ring: "ring-zinc-500/20",
  },

  request: {
    dot: "bg-yellow-700",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    ring: "ring-yellow-700/20",
  },

  invite: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
  },

  role: {
    dot: "bg-gray-400",
    bg: "bg-background-muted",
    text: "text-foreground-muted",
    ring: "ring-gray-500/20",
  },
  scheduled: {
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-500/20",
  },
  manual: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
  },
  upcoming: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
  },
  completed: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  cancelled: {
    dot: "bg-rose-500",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
  },
};

// Fallback khi variant không tồn tại trong CONFIG
const FALLBACK = {
  dot: "bg-gray-400",
  bg: "bg-background-muted",
  text: "text-foreground-muted",
  ring: "ring-gray-500/20",
};

export function Badge({
  variant,
  title = "",
  className = "",
  showDot = true,
}: BadgeProps) {
  const { dot, bg, text, ring } =
    CONFIG[variant as BadgeVariant] ?? FALLBACK;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        "ring-1 ring-inset whitespace-nowrap",
        bg,
        text,
        ring,
        className,
      ].join(" ")}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      )}

      {title}
    </span>
  );
}
