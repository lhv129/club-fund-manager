import { Skeleton } from "@/components/shared/ui/Skeleton";

/**
 * Skeleton cho 1 dòng club trong danh sách NoClubPage.
 * Layout khớp với ClubRow thật: logo | name+desc | button.
 */
export function ClubRowSkeleton() {
    return (
        <div className="rounded-lg border border-border bg-background-subtle p-4">
            <div className="flex items-center gap-4">
                {/* Logo */}
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />

                {/* Name + description */}
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/5 rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                </div>

                {/* Join button */}
                <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
            </div>
        </div>
    );
}