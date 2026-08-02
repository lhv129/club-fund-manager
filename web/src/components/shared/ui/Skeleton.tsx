import { cn } from "@/utils";

interface SkeletonProps {
    className?: string;
}

/**
 * Skeleton primitive — chỉ lo animate-pulse + semantic color.
 * Từng nơi tự compose hình dạng riêng bằng className.
 *
 * Dùng:
 *   <Skeleton className="h-4 w-32 rounded" />
 *   <Skeleton className="h-10 w-10 rounded-lg" />
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-background-muted",
                className
            )}
        />
    );
}