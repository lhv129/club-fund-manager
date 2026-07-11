import type { HTMLAttributes } from "react";
import { cn } from "@/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Card({ className, title, description, action, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-zinc-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
