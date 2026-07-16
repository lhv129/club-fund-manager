// src/components/shared/ui/Input.tsx
// FIX responsive: thêm text-base trên mobile để iOS không tự zoom khi focus
// (iOS Safari zoom khi font-size < 16px → dùng text-base trên mobile, text-sm từ sm trở lên)
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5 w-full min-w-0">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Layout — min-w-0 ngăn input làm tràn flex container
            "h-10 w-full min-w-0 rounded-lg border border-zinc-300 dark:border-zinc-700",
            "bg-white dark:bg-zinc-900 px-3",
            // font-size: 16px trên mobile ngăn iOS Safari tự zoom khi focus
            // text-sm (14px) trở lại từ sm breakpoint trở lên
            "text-base sm:text-sm text-zinc-900 dark:text-white",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
