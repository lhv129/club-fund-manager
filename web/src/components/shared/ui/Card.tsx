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
        "rounded-xl border border-border bg-background-subtle shadow-sm",
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
            {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}