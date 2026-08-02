import { Users, UserCircle2 } from "lucide-react";

interface ClubMetaProps {
    memberCount: number;
    role?: string;
    /** t("members") — "thành viên" */
    labelMembers: string;
    /** t("role") — "Vai trò" */
    labelRole: string;
}

/** 👥 28 thành viên  |  👤 Vai trò: Chủ CLB */
export function ClubMeta({ memberCount, role, labelMembers, labelRole }: ClubMetaProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                <span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
                        {memberCount.toLocaleString()}
                    </span>{" "}
                    {labelMembers}
                </span>
            </span>

            {role && (
                <>
                    <span aria-hidden className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <span className="flex items-center gap-1.5">
                        <UserCircle2 className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                        <span>
                            {labelRole}:{" "}
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{role}</span>
                        </span>
                    </span>
                </>
            )}
        </div>
    );
}
