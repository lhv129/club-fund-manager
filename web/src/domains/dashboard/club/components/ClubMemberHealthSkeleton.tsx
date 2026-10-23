import { CircleUserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/shared/ui/Skeleton";
import { DashboardCard } from "./DashboardCard";

export function ClubMemberHealthSkeleton() {
    const t = useTranslations("clubDashboard");

    return (
        <div role="status" aria-busy="true" aria-label={t("members.title")}>
            <span className="sr-only">{t("header.loading")}</span>
            <DashboardCard
                icon={CircleUserRound}
                title={t("members.title")}
                description={t("members.description")}
                action={<Skeleton className="h-5 w-20 rounded-md" />}
            >
                <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-5 min-[420px]:flex-row min-[420px]:items-center">
                        <Skeleton className="mx-auto size-24 shrink-0 rounded-full sm:size-28 min-[420px]:mx-0" />

                        <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex items-end justify-between gap-3">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-28 rounded" />
                                    <Skeleton className="h-3 w-40 max-w-full rounded" />
                                </div>
                                <Skeleton className="h-6 w-14 shrink-0 rounded" />
                            </div>
                            <Skeleton className="h-2.5 w-full rounded-full" />
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-border pt-5 sm:gap-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <div
                                key={index}
                                className="flex min-w-0 items-center gap-2.5 rounded-xl bg-background-subtle p-3 sm:gap-3"
                            >
                                <Skeleton className="size-8 shrink-0 rounded-lg sm:size-9" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-5 w-10 rounded" />
                                    <Skeleton className="h-3 w-20 max-w-full rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DashboardCard>
        </div>
    );
}
