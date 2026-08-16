import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils";

export function DashboardCard({ icon: Icon, title, description, action, children, className }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md", className)}>
    <header className="flex items-start justify-between gap-3 border-b border-border bg-background-subtle/60 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-[18px]" /></span><div className="min-w-0"><h2 className="text-sm font-semibold text-foreground sm:text-base">{title}</h2>{description && <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">{description}</p>}</div></div>
      {action}
    </header>
    {children}
  </section>;
}

export function DashboardState({ message }: { message: string }) {
  return <div className="flex min-h-48 items-center justify-center px-5 text-center text-sm text-foreground-muted">{message}</div>;
}
